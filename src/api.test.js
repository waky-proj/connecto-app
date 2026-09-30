import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createApiClient,
  needPayload,
  offeringPayload,
  normalizeMatches,
} from './api.js';
const userId = '11111111-1111-4111-8111-111111111111';
const need = {
  title: 'Fix the fence',
  description: 'Repair two panels',
  category: 'Home Help',
  budget: 150,
  skills: 'Building',
};
test('posts the backend Need contract with an existing user header', async () => {
  let captured;
  const client = createApiClient({
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return new Response(JSON.stringify({ id: userId }), { status: 201 });
    },
  });
  await client.createNeed(userId, needPayload(need, 'Auckland'));
  assert.equal(captured.url, '/api/needs');
  assert.equal(captured.options.headers['X-User-Id'], userId);
  assert.deepEqual(JSON.parse(captured.options.body), {
    title: need.title,
    description: need.description,
    category: need.category,
    skills: ['Building'],
    budgetMin: 0,
    budgetMax: 150,
    location: 'Auckland',
    deadline: null,
  });
});
test('blocks posting without an existing API user ID', async () => {
  let called = false;
  const client = createApiClient({
    fetchImpl: async () => {
      called = true;
    },
  });
  await assert.rejects(
    client.createNeed('', needPayload(need, 'Auckland')),
    /existing API user/,
  );
  assert.equal(called, false);
});
test('surfaces API validation errors and connectivity failures', async () => {
  const invalid = createApiClient({
    fetchImpl: async () =>
      new Response(JSON.stringify({ errors: { Title: ['Title is required.'] } }), {
        status: 400,
      }),
  });
  await assert.rejects(invalid.createNeed(userId, {}), /Title is required/);
  const offline = createApiClient({
    fetchImpl: async () => {
      throw new Error('network');
    },
  });
  await assert.rejects(offline.getMatches(userId), /Could not reach/);
});
test('uses actual MatchResult nested scores without inventing offering details', () => {
  const [match] = normalizeMatches(
    [
      {
        offeringId: userId,
        score: { total: 72, skills: 30 },
        reasons: ['Shared skill: Building'],
      },
    ],
    [],
    need,
  );
  assert.equal(match.score, 72);
  assert.equal(match.rate, null);
  assert.equal(match.source, 'api');
  assert.equal(match.breakdown.skills, 30);
  assert.deepEqual(match.reasons, ['Shared skill: Building']);
});
test('supports flattened responses and does not join demo records to API results', () => {
  const [match] = normalizeMatches(
    [{ offeringId: userId, score: 80, breakdown: { budget: 20 }, reasons: [] }],
    [{ id: userId, name: 'Demo name' }],
    need,
  );
  assert.equal(match.name, 'Matched offering');
  assert.equal(match.breakdown.budget, 20);
});
test('maps offering rates, skills, dates and experience to the API contract', () => {
  const payload = offeringPayload(
    {
      title: 'Repair',
      description: 'Fix fences',
      category: 'Home Help',
      skills: 'Building',
      rate: 30,
      experienceYears: 5,
    },
    'Auckland',
  );
  assert.equal(payload.priceMin, 30);
  assert.equal(payload.priceMax, 30);
  assert.equal(payload.experienceYears, 5);
  assert.equal(payload.availableFrom, null);
  assert.deepEqual(payload.skills, ['Building']);
});

test('includes HTTP status and problem details in proxy errors', async () => {
  const client = createApiClient({
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          title: 'Connecto API timed out',
          detail: 'Check the database connection.',
        }),
        { status: 504 },
      ),
  });
  await assert.rejects(
    client.createOffering(userId, {}),
    /POST \/api\/offerings — HTTP 504.*Check the database/,
  );
});
test('reports empty and malformed success responses with their HTTP status', async () => {
  for (const body of ['', '<html>Unexpected page</html>']) {
    const client = createApiClient({
      fetchImpl: async () => new Response(body, { status: 201 }),
    });
    await assert.rejects(
      client.createOffering(userId, {}),
      /HTTP 201.*empty or invalid JSON/,
    );
  }
});
test('distinguishes timeouts from HTTP failures and warns about duplicate posts', async () => {
  const client = createApiClient({
    fetchImpl: async () => {
      throw new DOMException('Timeout', 'TimeoutError');
    },
  });
  await assert.rejects(
    client.createOffering(userId, {}),
    /timed out after 15 seconds.*may have been saved/,
  );
});
test('does not expose raw exception pages for HTTP failures', async () => {
  const client = createApiClient({
    fetchImpl: async () =>
      new Response('<html>private server stack</html>', { status: 500 }),
  });
  await assert.rejects(
    client.getMatches(userId),
    (error) =>
      error.message.includes('HTTP 500') &&
      !error.message.includes('private server stack'),
  );
});

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
test('safety requests use authenticated routes and keep report data in the request body', async () => {
  const calls = [];
  const client = createApiClient({
    getAccessToken: async () => 'access-token',
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return new Response(options.method === 'DELETE' || options.method === 'PUT' ? null : '{}',
        { status: options.method === 'DELETE' || options.method === 'PUT' ? 204 : 200 });
    },
  });
  await client.blockMember(userId);
  await client.reportMember({ subjectId: userId, reason: 'unsafe', details: 'Private details' });
  await client.unblockMember(userId);
  assert.deepEqual(calls.map(({ options }) => options.method), ['PUT', 'POST', 'DELETE']);
  assert.ok(calls.every(({ options }) => options.headers.Authorization === 'Bearer access-token'));
  assert.equal(calls[1].url, '/api/safety/reports');
  assert.equal(JSON.parse(calls[1].options.body).details, 'Private details');
  assert.ok(!calls[1].url.includes('Private details'));
});
test('discovery requests use authenticated paginated GET routes', async () => {
  const calls = [];
  const client = createApiClient({
    getAccessToken: async () => 'access-token',
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return new Response(JSON.stringify(url.includes('/offerings?')
        ? { offerings: [], total: 0, page: 2, pageSize: 20 }
        : { id: userId, title: 'Computer help' }));
    },
  });
  const results = await client.searchOfferings({ query: 'computer help', category: 'Technology', page: 2 });
  const detail = await client.getOfferingDetail(userId);
  assert.equal(results.total, 0);
  assert.equal(detail.id, userId);
  assert.match(calls[0].url, /query=computer\+help/);
  assert.match(calls[0].url, /page=2/);
  assert.equal(calls[0].options.method, 'GET');
  assert.equal(calls[1].options.headers.Authorization, 'Bearer access-token');
});
test('account switch while awaiting a token blocks the outgoing write', async () => {
  let generation = 1,
    finish,
    calls = 0;
  const client = createApiClient({
    getSessionGeneration: () => generation,
    getAccessToken: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
    fetchImpl: async () => {
      calls++;
      return new Response('{}');
    },
  });
  const pending = client.createNeed({});
  generation++;
  finish('other-account-token');
  await assert.rejects(pending, /Session changed/);
  assert.equal(calls, 0);
});
test('late private response or 401 cannot affect the next account', async () => {
  for (const status of [200, 401]) {
    let generation = 1,
      finish,
      invalidations = 0;
    const client = createApiClient({
      getSessionGeneration: () => generation,
      getAccessToken: async () => 'account-a',
      onUnauthorized: () => {
        invalidations++;
      },
      fetchImpl: () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    });
    const pending = client.getProfile();
    await new Promise((resolve) => setImmediate(resolve));
    generation++;
    finish(new Response('{"name":"Private A"}', { status }));
    await assert.rejects(pending, /Session changed/);
    assert.equal(invalidations, 0);
  }
});
test('current 401 invalidates once without retrying a write; 403 does not', async () => {
  for (const status of [401, 403]) {
    const invalidated = [];
    let calls = 0;
    const client = createApiClient({
      getSessionGeneration: () => 7,
      getAccessToken: async () => 'current-token',
      onUnauthorized: (...args) => invalidated.push(args),
      fetchImpl: async () => {
        calls++;
        return new Response('{}', { status });
      },
    });
    await assert.rejects(client.createNeed({}), new RegExp(`HTTP ${status}`));
    assert.equal(calls, 1);
    assert.deepEqual(invalidated, status === 401 ? [['current-token', 7]] : []);
  }
});
test('profile edits use PATCH and activity uses a bounded own-resource query', async () => {
  const calls = [];
  const client = createApiClient({
    getAccessToken: async () => 'token',
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return new Response('{}');
    },
  });
  await client.updateProfile({ firstName: 'A', city: 'Auckland' });
  await client.getActivity(2);
  assert.equal(calls[0].options.method, 'PATCH');
  assert.equal(calls[0].url, '/api/users/me');
  assert.equal(calls[1].url, '/api/users/me/activity?page=2&pageSize=20');
  assert.equal(calls[1].options.headers.Authorization, 'Bearer token');
});
test('posts the backend Need contract with a bearer token', async () => {
  let captured;
  const client = createApiClient({
    getAccessToken: async () => 'test-access-token',
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return new Response(JSON.stringify({ id: userId }), { status: 201 });
    },
  });
  await client.createNeed(needPayload(need, 'Auckland'));
  assert.equal(captured.url, '/api/needs');
  assert.equal(captured.options.headers.Authorization, 'Bearer test-access-token');
  assert.equal(captured.options.headers['X-User-Id'], undefined);
  assert.deepEqual(JSON.parse(captured.options.body), {
    title: need.title,
    description: need.description,
    category: need.category,
    skills: ['Building'],
    budgetMin: 0,
    budgetMax: 150,
    currency: 'NZD',
    pricingBasis: 'fixed',
    estimatedHours: null,
    location: 'Auckland',
    deadline: null,
  });
});
test('posts revision-checked listing lifecycle commands', async () => {
  const calls = [];
  const client = createApiClient({
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return new Response(JSON.stringify({ id: userId, status: 2, revision: 5 }));
    },
  });

  await client.changeNeedLifecycle(userId, 'pause', 4);
  await client.changeOfferingLifecycle(userId, 'close', 5);

  assert.equal(calls[0].url, `/api/needs/${userId}/pause`);
  assert.deepEqual(JSON.parse(calls[0].options.body), { revision: 4 });
  assert.equal(calls[1].url, `/api/offerings/${userId}/close`);
  assert.deepEqual(JSON.parse(calls[1].options.body), { revision: 5 });
});
test('patches a listing with its current revision', async () => {
  let captured;
  const client = createApiClient({
    fetchImpl: async (url, options) => {
      captured = { url, options };
      return new Response(JSON.stringify({ id: userId, revision: 2 }));
    },
  });
  await client.updateNeed(userId, { title: 'Updated', revision: 1 });
  assert.equal(captured.url, `/api/needs/${userId}`);
  assert.equal(captured.options.method, 'PATCH');
  assert.deepEqual(JSON.parse(captured.options.body), { title: 'Updated', revision: 1 });
});
test('blocks API requests when the session provider requires login', async () => {
  let called = false;
  const client = createApiClient({
    getAccessToken: async () => {
      throw new Error('Log in before using the backend API.');
    },
    fetchImpl: async () => {
      called = true;
    },
  });
  await assert.rejects(client.createNeed({}), /Log in/);
  assert.equal(called, false);
});
test('surfaces API validation errors and connectivity failures', async () => {
  const invalid = createApiClient({
    fetchImpl: async () =>
      new Response(JSON.stringify({ errors: { Title: ['Title is required.'] } }), {
        status: 400,
      }),
  });
  await assert.rejects(invalid.createNeed({}), /Title is required/);
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
  assert.equal(match.name, 'Member');
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
    client.createOffering({}),
    /POST \/api\/offerings — HTTP 504.*Check the database/,
  );
});
test('reports empty and malformed success responses with their HTTP status', async () => {
  for (const body of ['', '<html>Unexpected page</html>']) {
    const client = createApiClient({
      fetchImpl: async () => new Response(body, { status: 201 }),
    });
    await assert.rejects(client.createOffering({}), /HTTP 201.*empty or invalid JSON/);
  }
});
test('distinguishes timeouts from HTTP failures and warns about duplicate posts', async () => {
  const client = createApiClient({
    fetchImpl: async () => {
      throw new DOMException('Timeout', 'TimeoutError');
    },
  });
  await assert.rejects(
    client.createOffering({}),
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

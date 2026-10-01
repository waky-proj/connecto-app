import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCognitoClient } from './cognito.js';
const config = { region: 'ap-southeast-2', clientId: 'public-client' };
test('failed account switch never leaves the previous account authenticated', async () => {
  let calls = 0;
  const client = createCognitoClient({
    ...config,
    fetchImpl: async () =>
      ++calls === 1
        ? new Response(
            JSON.stringify({
              AuthenticationResult: {
                AccessToken: 'a',
                RefreshToken: 'r',
                ExpiresIn: 60,
              },
            }),
          )
        : new Response(
            JSON.stringify({
              __type: 'NotAuthorizedException',
              message: 'Incorrect username or password.',
            }),
            { status: 400 },
          ),
  });
  await client.login({ email: 'a@example.com', password: 'example' });
  await assert.rejects(
    client.login({ email: 'b@example.com', password: 'wrong' }),
    /Incorrect/,
  );
  await assert.rejects(client.getAccessToken(), /Log in/);
});
test('missing refresh token expires private session and removed listeners stay removed', async () => {
  let time = 0,
    expired = 0;
  const client = createCognitoClient({
    ...config,
    now: () => time,
    fetchImpl: async () =>
      new Response(
        JSON.stringify({ AuthenticationResult: { AccessToken: 'a', ExpiresIn: 60 } }),
      ),
  });
  const unsubscribe = client.onSessionExpired(() => {
    expired++;
  });
  unsubscribe();
  client.onSessionExpired(() => {
    expired++;
  });
  await client.login({ email: 'a@example.com', password: 'example' });
  time = 40000;
  await assert.rejects(client.getAccessToken(), /expired/);
  assert.equal(expired, 1);
  await assert.rejects(client.getAccessToken(), /Log in/);
});
test('malformed token results never establish an authenticated session', async () => {
  for (const result of [
    { ExpiresIn: 60 },
    { AccessToken: 'a', ExpiresIn: 0 },
    { AccessToken: 'a', ExpiresIn: 'invalid' },
  ]) {
    const client = createCognitoClient({
      ...config,
      fetchImpl: async () =>
        new Response(JSON.stringify({ AuthenticationResult: result })),
    });
    await assert.rejects(
      client.login({ email: 'a@example.com', password: 'example' }),
      /valid access token/,
    );
    await assert.rejects(client.getAccessToken(), /Log in/);
  }
});
test('permanent refresh rejection expires session and notifies UI once', async () => {
  let time = 0,
    calls = 0,
    expired = 0;
  const client = createCognitoClient({
    ...config,
    now: () => time,
    fetchImpl: async () =>
      ++calls === 1
        ? new Response(
            JSON.stringify({
              AuthenticationResult: {
                AccessToken: 'a',
                RefreshToken: 'r',
                ExpiresIn: 60,
              },
            }),
          )
        : new Response(
            JSON.stringify({
              __type: 'NotAuthorizedException',
              message: 'Invalid refresh token.',
            }),
            { status: 400 },
          ),
  });
  const unsubscribe = client.onSessionExpired(() => {
    expired++;
  });
  await client.login({ email: 'a@example.com', password: 'example' });
  time = 40000;
  await assert.rejects(client.getAccessToken(), /expired/);
  await assert.rejects(client.getAccessToken(), /Log in/);
  assert.equal(expired, 1);
  unsubscribe();
});
test('stale rejected access token cannot erase a refreshed session or next account', async () => {
  let time = 0,
    calls = 0,
    expired = 0;
  const client = createCognitoClient({
    ...config,
    now: () => time,
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          AuthenticationResult: {
            AccessToken: `token-${++calls}`,
            RefreshToken: 'r',
            ExpiresIn: 60,
          },
        }),
      ),
  });
  const unsubscribe = client.onSessionExpired(() => {
    expired++;
  });
  await client.login({ email: 'a@example.com', password: 'example' });
  const firstGeneration = client.getSessionGeneration();
  time = 40000;
  assert.equal(await client.getAccessToken(), 'token-2');
  client.rejectAccessToken('token-1', firstGeneration);
  assert.equal(await client.getAccessToken(), 'token-2');
  await client.login({ email: 'b@example.com', password: 'example' });
  client.rejectAccessToken('token-2', firstGeneration);
  assert.equal(await client.getAccessToken(), 'token-3');
  client.rejectAccessToken('token-3', client.getSessionGeneration());
  assert.equal(expired, 1);
  await assert.rejects(client.getAccessToken(), /Log in/);
  unsubscribe();
});
test('concurrent refresh shares one request and network failure permits retry', async () => {
  let time = 0,
    calls = 0,
    finish;
  const client = createCognitoClient({
    ...config,
    now: () => time,
    fetchImpl: async () => {
      calls++;
      if (calls === 2) throw new Error('offline');
      if (calls === 3)
        return new Promise((resolve) => {
          finish = resolve;
        });
      return new Response(
        JSON.stringify({
          AuthenticationResult: { AccessToken: 'a', RefreshToken: 'r', ExpiresIn: 60 },
        }),
      );
    },
  });
  await client.login({ email: 'a@example.com', password: 'example' });
  time = 40000;
  await assert.rejects(client.getAccessToken(), /connection/);
  const first = client.getAccessToken();
  const second = client.getAccessToken();
  assert.equal(calls, 3);
  finish(
    new Response(
      JSON.stringify({ AuthenticationResult: { AccessToken: 'b', ExpiresIn: 60 } }),
    ),
  );
  assert.deepEqual(await Promise.all([first, second]), ['b', 'b']);
});

test('late successful refresh after logout cannot restore a session', async () => {
  let time = 0,
    calls = 0,
    finish;
  const client = createCognitoClient({
    ...config,
    now: () => time,
    fetchImpl: async () => {
      if (++calls === 2)
        return new Promise((resolve) => {
          finish = resolve;
        });
      return new Response(
        JSON.stringify({
          AuthenticationResult: { AccessToken: 'a', RefreshToken: 'r', ExpiresIn: 60 },
        }),
      );
    },
  });
  await client.login({ email: 'a@example.com', password: 'example' });
  time = 40000;
  const pending = client.getAccessToken();
  client.logout();
  finish(
    new Response(
      JSON.stringify({ AuthenticationResult: { AccessToken: 'late', ExpiresIn: 60 } }),
    ),
  );
  await assert.rejects(pending, /expired|changed/);
  await assert.rejects(client.getAccessToken(), /Log in/);
});
test('delayed login cannot restore tokens after logout', async () => {
  let finish;
  const client = createCognitoClient({
    ...config,
    fetchImpl: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  const pending = client.login({ email: 'a@example.com', password: 'example' });
  client.logout();
  finish(
    new Response(JSON.stringify({ AuthenticationResult: { AccessToken: 'private-a' } })),
  );
  await assert.rejects(pending, /cancelled/);
  await assert.rejects(client.getAccessToken(), /Log in/);
});

test('old refresh failure cannot erase a newly logged in account', async () => {
  let time = 0,
    finish,
    calls = 0;
  const client = createCognitoClient({
    ...config,
    now: () => time,
    fetchImpl: async () => {
      calls++;
      if (calls === 2)
        return new Promise((resolve) => {
          finish = resolve;
        });
      return new Response(
        JSON.stringify({
          AuthenticationResult: {
            AccessToken: calls === 1 ? 'private-a' : 'private-b',
            RefreshToken: 'refresh',
            ExpiresIn: 60,
          },
        }),
      );
    },
  });
  await client.login({ email: 'a@example.com', password: 'example' });
  time = 40000;
  const refresh = client.getAccessToken();
  client.logout();
  await client.login({ email: 'b@example.com', password: 'example' });
  finish(new Response('{}', { status: 400 }));
  await assert.rejects(refresh, /expired/);
  assert.equal(await client.getAccessToken(), 'private-b');
});
test('registers email credentials and confirms using Cognito operations', async () => {
  const calls = [];
  const client = createCognitoClient({
    ...config,
    fetchImpl: async (url, options) => {
      calls.push({
        url,
        action: options.headers['X-Amz-Target'],
        body: JSON.parse(options.body),
      });
      return new Response('{}');
    },
  });
  await client.register({
    name: 'Neighbor',
    email: 'test@example.com',
    password: 'not-stored',
  });
  await client.confirm('test@example.com', '123456');
  assert.equal(calls[0].body.Password, 'not-stored');
  assert.equal(calls[0].body.ClientId, 'public-client');
  assert.ok(calls[1].action.endsWith('ConfirmSignUp'));
  assert.equal(calls[1].body.ConfirmationCode, '123456');
  await assert.rejects(client.getAccessToken(), /Log in/);
});
test('keeps access tokens in memory, refreshes expired sessions, and logs out', async () => {
  let time = 0;
  const calls = [];
  const client = createCognitoClient({
    ...config,
    now: () => time,
    fetchImpl: async (url, options) => {
      calls.push(JSON.parse(options.body));
      return new Response(
        JSON.stringify({
          AuthenticationResult: {
            AccessToken: 'access-' + calls.length,
            RefreshToken: 'refresh',
            ExpiresIn: 60,
          },
        }),
      );
    },
  });
  await client.login({ email: 'test@example.com', password: 'example' });
  assert.equal(await client.getAccessToken(), 'access-1');
  time = 40000;
  assert.equal(await client.getAccessToken(), 'access-2');
  assert.equal(calls[1].AuthFlow, 'REFRESH_TOKEN_AUTH');
  client.logout();
  await assert.rejects(client.getAccessToken(), /Log in/);
});
test('does not authenticate challenges or incorrect passwords', async () => {
  const challenge = createCognitoClient({
    ...config,
    fetchImpl: async () => new Response(JSON.stringify({ ChallengeName: 'SMS_MFA' })),
  });
  await assert.rejects(
    challenge.login({ email: 'test@example.com', password: 'example' }),
    /SMS_MFA/,
  );
  await assert.rejects(challenge.getAccessToken(), /Log in/);
  const denied = createCognitoClient({
    ...config,
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          __type: 'NotAuthorizedException',
          message: 'Incorrect username or password.',
        }),
        { status: 400 },
      ),
  });
  await assert.rejects(
    denied.login({ email: 'test@example.com', password: 'example' }),
    /Incorrect username/,
  );
});
test('requires configuration before sending credentials', async () => {
  let called = false;
  const client = createCognitoClient({
    fetchImpl: async () => {
      called = true;
    },
  });
  await assert.rejects(
    client.login({ email: 'test@example.com', password: 'example' }),
    /Configure/,
  );
  assert.equal(called, false);
});

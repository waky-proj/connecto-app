import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCognitoClient } from './cognito.js';
const config = { region: 'ap-southeast-2', clientId: 'public-client' };
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

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSessionScope, clearLegacyPrivateState } from './sessionScope.js';

test('logout and next login invalidate prior account requests including delayed errors', async () => {
  const scope = createSessionScope();
  const accountA = scope.reset();
  let resolve;
  const delayed = new Promise((done) => {
    resolve = done;
  });
  const applied = [];
  const pending = delayed.then((data) => {
    if (scope.isCurrent(accountA)) applied.push(data);
  });
  scope.reset(); // logout
  const accountB = scope.reset();
  resolve('private A activity');
  await pending;
  assert.deepEqual(applied, []);
  assert.equal(scope.isCurrent(accountB), true);
  assert.equal(scope.isCurrent(accountA), false);
});

test('removes legacy shared private collections without deleting unrelated preferences', () => {
  const data = new Map(
    ['profile', 'offers', 'needs', 'messages', 'api-mode'].map((name) => [
      `connecto-${name}`,
      'private A data',
    ]),
  );
  data.set('unrelated', 'keep');
  clearLegacyPrivateState({ removeItem: (key) => data.delete(key) });
  assert.deepEqual([...data], [['unrelated', 'keep']]);
  assert.doesNotThrow(() =>
    clearLegacyPrivateState({
      removeItem() {
        throw Error();
      },
    }),
  );
});

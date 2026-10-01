import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadMemberActivity } from './loadActivity.js';

test('loads independent Need and Offering totals across pages and maps safe view fields', async () => {
  const calls = [];
  const api = {
    async getActivity(page) {
      calls.push(page);
      return {
        pageSize: 1,
        needTotal: 2,
        offeringTotal: 1,
        needs: [{ id: page, budgetMax: 50 }],
        offerings: page === 1 ? [{ id: 'offer', priceMax: 30 }] : [],
      };
    },
  };
  const data = await loadMemberActivity(api, { name: 'Member A' }, () => true);
  assert.deepEqual(calls, [1, 2]);
  assert.equal(data.needs.length, 2);
  assert.equal(data.needs[0].budget, 50);
  assert.equal(data.offers[0].name, 'Member A');
  assert.equal(data.offers[0].rate, 30);
  assert.equal(data.offers[0].rating, null);
});
test('discard an old account response and stop pagination immediately after account change', async () => {
  let current = true;
  let resolve;
  let calls = 0;
  const pending = loadMemberActivity(
    {
      getActivity() {
        calls++;
        return new Promise((done) => {
          resolve = done;
        });
      },
    },
    { name: 'Old account' },
    () => current,
  );
  current = false;
  resolve({
    pageSize: 1,
    needTotal: 20,
    offeringTotal: 0,
    needs: [{ id: 'private' }],
    offerings: [],
  });
  assert.equal(await pending, null);
  assert.equal(calls, 1);
});
test('an expired session never starts a request and API failures reach the caller', async () => {
  assert.equal(
    await loadMemberActivity(
      {
        getActivity() {
          throw new Error('must not call');
        },
      },
      {},
      () => false,
    ),
    null,
  );
  await assert.rejects(
    loadMemberActivity(
      {
        getActivity() {
          throw new Error('offline');
        },
      },
      {},
      () => true,
    ),
    /offline/,
  );
});

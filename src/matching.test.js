import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rankMatches, initialOfferings } from './matching.js';
const need = {
  category: 'Garden',
  budget: 150,
  hours: 3,
  timeframe: 'This Weekend',
  radius: 1,
  tools: true,
};
test('ranks compatible garden helpers and provides budget and distance explanations', () => {
  const results = rankMatches(need, initialOfferings);
  assert.equal(results[0].id, 'marcus');
  assert.equal(results[0].score, 100);
  assert.equal(results[0].estimatedCost, 75);
  assert.equal(results.length, 3);
  assert.ok(results[0].reasons.some((r) => r.includes('fits your $150')));
  assert.ok(results[2].reasons.some((r) => r.includes('Availability needs confirming')));
});
test('penalizes budget, tools, and distance mismatches without hiding tradeoffs', () => {
  const [result] = rankMatches({ ...need, budget: 10, radius: 0.1 }, [
    { ...initialOfferings[0], tools: false },
  ]);
  assert.equal(result.score, 60);
  assert.ok(result.reasons.some((r) => r.includes('exceeds')));
  assert.ok(result.reasons.some((r) => r.includes('not included')));
  assert.ok(result.reasons.some((r) => r.includes('Outside')));
});
test('handles no category matches and flexible availability', () => {
  assert.deepEqual(rankMatches({ ...need, category: 'Other' }, initialOfferings), []);
  const [result] = rankMatches({ ...need, timeframe: 'Flexible' }, [initialOfferings[0]]);
  assert.equal(result.score, 100);
});

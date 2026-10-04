import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mapProfile, buildProfileUpdate, needsProfileSetup } from './model.js';

test('profile update preserves multiword names and sends only editable fields', () => {
  assert.deepEqual(
    buildProfileUpdate({
      firstName: ' Mary Jane ',
      lastName: ' van der Berg ',
      neighborhood: ' Auckland ',
      bio: ' Hello ',
      id: 'other-user',
      email: 'spoof@example.com',
      reputationScore: 100,
    }),
    { firstName: 'Mary Jane', lastName: 'van der Berg', city: 'Auckland', bio: 'Hello' },
  );
});
test('profile form rejects whitespace-only required fields and contract overflows', () => {
  const data = { firstName: 'A', neighborhood: 'Auckland' };
  for (const invalid of [
    { firstName: '   ' },
    { neighborhood: '\t ' },
    { firstName: 'x'.repeat(201) },
    { lastName: 'x'.repeat(201) },
    { neighborhood: 'x'.repeat(201) },
    { bio: 'x'.repeat(2001) },
  ])
    assert.throws(() => buildProfileUpdate({ ...data, ...invalid }));
  assert.equal(buildProfileUpdate({ ...data, bio: '' }).bio, '');
  assert.equal(buildProfileUpdate({ ...data, lastName: '' }).lastName, '');
});
test('real empty profile stays empty and prompts setup instead of inventing identity', () => {
  const profile = mapProfile({
    id: 'member',
    firstName: '',
    lastName: '',
    city: '',
    bio: '',
  });
  assert.equal(profile.name, '');
  assert.equal(profile.neighborhood, '');
  assert.equal(needsProfileSetup(profile), true);
});
test('saved profile maps all name parts and does not require repeat setup', () => {
  const profile = mapProfile({
    id: 'member',
    firstName: 'Mary Jane',
    middleName: 'Ann',
    lastName: 'van der Berg',
    city: 'Auckland',
    bio: 'Hi',
  });
  assert.equal(profile.name, 'Mary Jane Ann van der Berg');
  assert.equal(needsProfileSetup(profile), false);
});

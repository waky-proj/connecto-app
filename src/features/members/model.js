export function mapProfile(user) {
  return {
    ...user,
    name: [user.firstName, user.middleName, user.lastName].filter(Boolean).join(' '),
    neighborhood: user.city || '',
    bio: user.bio || '',
    id: user.id,
  };
}

export function buildProfileUpdate(data) {
  const firstName = (data.firstName || '').trim();
  const lastName = (data.lastName || '').trim();
  const city = (data.neighborhood || '').trim();
  const bio = (data.bio || '').trim();
  if (!firstName || !city) throw new Error('Enter your first name and neighborhood.');
  if (
    [firstName, lastName, city].some((value) => value.length > 200) ||
    bio.length > 2000
  )
    throw new Error(
      'Names and neighborhood must be at most 200 characters; your bio at most 2000.',
    );
  return { firstName, lastName, city, bio };
}

export function needsProfileSetup(profile) {
  return !profile.firstName?.trim() || !profile.neighborhood?.trim();
}

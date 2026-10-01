export function mapProfile(user) {
  return {
    ...user,
    name: [user.firstName, user.lastName].filter(Boolean).join(' '),
    neighborhood: user.city || '',
    bio: user.bio || '',
    id: user.id,
  };
}

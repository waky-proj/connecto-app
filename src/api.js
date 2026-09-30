const guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const apiSkills = [
  'Programming',
  'Design',
  'Marketing',
  'Sales',
  'React',
  'Typescript',
  'Building',
];
export function needPayload(need, location) {
  return {
    title: need.title,
    description: need.description,
    category: need.category,
    skills: need.skills ? [need.skills] : [],
    budgetMin: 0,
    budgetMax: Number(need.budget),
    location,
    deadline: need.deadline ? new Date(need.deadline).toISOString() : null,
  };
}
export function offeringPayload(offer, location) {
  return {
    title: offer.title,
    description: offer.description,
    category: offer.category,
    skills: offer.skills ? [offer.skills] : [],
    priceMin: Number(offer.rate),
    priceMax: Number(offer.rate),
    location,
    remoteAvailable: false,
    availableFrom: offer.availableFrom
      ? new Date(offer.availableFrom).toISOString()
      : null,
    availableUntil: offer.availableUntil
      ? new Date(offer.availableUntil).toISOString()
      : null,
    experienceYears: Number(offer.experienceYears || 0),
  };
}
export function normalizeMatches(matches, offers, need) {
  if (!Array.isArray(matches)) throw new Error('The API returned an invalid match list.');
  return matches
    .map((match) => {
      const known = offers.find(
        (offer) => offer.id === match.offeringId && offer.source === 'api',
      );
      const breakdown = typeof match.score === 'object' ? match.score : match.breakdown;
      const score = typeof match.score === 'number' ? match.score : match.score?.total;
      if (!match.offeringId || !Number.isFinite(score))
        throw new Error('The API returned an invalid match.');
      return {
        ...(known || {
          id: match.offeringId,
          name: 'Matched offering',
          title: `Offering ${match.offeringId.slice(0, 8)}`,
          category: need.category,
          description:
            'The API returned a match ID and explanations. Offering details are not yet available from the backend.',
          rate: null,
          distance: null,
          tools: null,
          rating: 0,
          reviews: 0,
          emoji: '🤝',
        }),
        source: 'api',
        score,
        breakdown,
        reasons: match.reasons || [],
      };
    })
    .sort((a, b) => b.score - a.score);
}
export function createApiClient({ baseUrl = '', fetchImpl = globalThis.fetch } = {}) {
  async function request(path, { userId, body } = {}) {
    if (body && !guid.test(userId || ''))
      throw new Error('Enter an existing API user ID in your profile before posting.');
    const method = body ? 'POST' : 'GET';
    let response;
    try {
      response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          ...(body ? { 'Content-Type': 'application/json', 'X-User-Id': userId } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(15000),
      });
      const text = response.status === 204 ? '' : await response.text();
      let data;
      if (text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          /* Never display raw HTML or backend stack traces. */
        }
      }
      if (!response.ok) {
        const details = data?.errors
          ? Object.values(data.errors).flat().join(' ')
          : [data?.title, data?.detail].filter(Boolean).join(': ');
        throw new Error(
          `${method} ${path} — HTTP ${response.status}. ${details || 'The server returned no readable error details. Check the backend logs.'}`,
        );
      }
      if (response.status === 204) return null;
      if (data === undefined)
        throw new Error(
          `${method} ${path} — HTTP ${response.status}, but the API returned an empty or invalid JSON response.`,
        );
      return data;
    } catch (error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        throw new Error(
          `${method} ${path} timed out after 15 seconds. No complete response was received. Check the backend debugger and database connection.${body ? ' Your post may have been saved; check before resubmitting.' : ''}`,
        );
      }
      if (response) throw error;
      throw new Error(
        `Could not reach Connecto API for ${method} ${path}. No HTTP response was received. Check the backend, proxy configuration, or browser CORS settings.`,
      );
    }
  }

  return {
    createNeed: (userId, body) => request('/api/needs', { userId, body }),
    createOffering: (userId, body) => request('/api/offerings', { userId, body }),
    getMatches: (id) => {
      if (!guid.test(id)) throw new Error('Invalid Need ID.');
      return request(`/api/needs/${encodeURIComponent(id)}/matches`);
    },
  };
}

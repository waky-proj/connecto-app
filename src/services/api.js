export { normalizeMatches } from '../shared/lib/matchView.js';
export { apiSkills } from '../shared/lib/skills.js';
const guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function needPayload(need, location) {
  const hasPrice = !['free', 'negotiable'].includes(need.pricingBasis);
  return {
    title: need.title,
    description: need.description,
    category: need.category,
    skills: need.skills ? [need.skills] : [],
    budgetMin: hasPrice ? 0 : null,
    budgetMax: hasPrice ? Number(need.budget) : null,
    currency: 'NZD',
    pricingBasis: need.pricingBasis || 'fixed',
    estimatedHours: need.pricingBasis === 'hourly' ? Number(need.hours) : null,
    location,
    deadline: need.deadline ? new Date(need.deadline).toISOString() : null,
  };
}
export function offeringPayload(offer, location) {
  const hasPrice = !['free', 'negotiable'].includes(offer.pricingBasis);
  return {
    title: offer.title,
    description: offer.description,
    category: offer.category,
    skills: offer.skills ? [offer.skills] : [],
    priceMin: hasPrice ? Number(offer.rate) : null,
    priceMax: hasPrice ? Number(offer.rate) : null,
    currency: 'NZD',
    pricingBasis: offer.pricingBasis || 'hourly',
    estimatedHours: null,
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
export function createApiClient({
  baseUrl = '',
  fetchImpl = globalThis.fetch,
  getAccessToken = async () => null,
  getSessionGeneration = () => 0,
  onUnauthorized = () => {},
} = {}) {
  async function request(path, { body, method = body ? 'POST' : 'GET' } = {}) {
    const generation = getSessionGeneration();
    function requireCurrentSession() {
      if (generation !== getSessionGeneration()) {
        const error = new Error(
          'Session changed. Please try again in your current account.',
        );
        error.code = 'SESSION_CHANGED';
        throw error;
      }
    }
    const token = await getAccessToken();
    requireCurrentSession();
    let response;
    try {
      response = await fetchImpl(`${baseUrl.replace(/\/$/, '')}${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(15000),
      });
      const text = response.status === 204 ? '' : await response.text();
      requireCurrentSession();
      let data;
      if (text.trim()) {
        try {
          data = JSON.parse(text);
        } catch {
          /* Never display raw HTML or backend stack traces. */
        }
      }
      if (!response.ok) {
        if (response.status === 401 && token) onUnauthorized(token, generation);
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
      if (error.code === 'SESSION_CHANGED') throw error;
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
    getProfile: () => request('/api/users/me'),
    updateProfile: (body) => request('/api/users/me', { body, method: 'PATCH' }),
    getActivity: (page = 1) => request(`/api/users/me/activity?page=${page}&pageSize=20`),
    createNeed: (body) => request('/api/needs', { body }),
    createOffering: (body) => request('/api/offerings', { body }),
    updateNeed: (id, body) =>
      request(`/api/needs/${encodeURIComponent(id)}`, { body, method: 'PATCH' }),
    updateOffering: (id, body) =>
      request(`/api/offerings/${encodeURIComponent(id)}`, { body, method: 'PATCH' }),
    changeNeedLifecycle: (id, action, revision) =>
      request(`/api/needs/${encodeURIComponent(id)}/${action}`, {
        body: { revision },
      }),
    changeOfferingLifecycle: (id, action, revision) =>
      request(`/api/offerings/${encodeURIComponent(id)}/${action}`, {
        body: { revision },
      }),
    getMatches: (id) => {
      if (!guid.test(id)) throw new Error('Invalid Need ID.');
      return request(`/api/needs/${encodeURIComponent(id)}/matches`);
    },
    searchOfferings: ({
      query = '',
      category = '',
      availableToday = false,
      page = 1,
    } = {}) => {
      const params = new URLSearchParams({
        query,
        category,
        availableToday: String(availableToday),
        page: String(page),
      });
      return request(`/api/discover/offerings?${params}`);
    },
    getOfferingDetail: (id) => {
      if (!guid.test(id)) throw new Error('Invalid Offering ID.');
      return request(`/api/discover/offerings/${encodeURIComponent(id)}`);
    },
    getBlocks: () => request('/api/safety/blocks'),
    blockMember: (id) =>
      request(`/api/safety/blocks/${encodeURIComponent(id)}`, { method: 'PUT' }),
    unblockMember: (id) =>
      request(`/api/safety/blocks/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    reportMember: (body) => request('/api/safety/reports', { body }),
    getOwnReports: () => request('/api/safety/reports'),
    getOperatorCases: () => request('/api/safety/cases'),
    reviewOperatorCase: (id) =>
      request(`/api/safety/cases/${encodeURIComponent(id)}/review`, { method: 'POST' }),
    getOutcomeDisputes: () => request('/api/outcome-disputes'),
    reviewOutcomeDispute: (id, note) => {
      if (!guid.test(id)) throw new Error('Invalid agreement ID.');
      return request(`/api/outcome-disputes/${encodeURIComponent(id)}/review`, { body: { note } });
    },
    createConnectionRequest: (body) => request('/api/connection-requests', { body }),
    getConnectionRequests: (page = 1) =>
      request(`/api/connection-requests?page=${page}&pageSize=20`),
    decideConnectionRequest: (id, action, revision) => {
      if (!guid.test(id) || !['decline', 'withdraw'].includes(action))
        throw new Error('Invalid request action.');
      return request(`/api/connection-requests/${encodeURIComponent(id)}/${action}`, {
        body: { revision },
      });
    },
    acceptConnectionRequest: (id, revision, idempotencyKey) => {
      if (!guid.test(id)) throw new Error('Invalid request ID.');
      return request(`/api/connection-requests/${encodeURIComponent(id)}/accept`, {
        body: { revision, idempotencyKey },
      });
    },
    getAgreements: () => request('/api/agreements'),
    getAgreement: (id) => {
      if (!guid.test(id)) throw new Error('Invalid agreement ID.');
      return request(`/api/agreements/${encodeURIComponent(id)}`);
    },
    getOutcome: (id) => {
      if (!guid.test(id)) throw new Error('Invalid agreement ID.');
      return request(`/api/agreements/${encodeURIComponent(id)}/outcome`);
    },
    changeOutcome: (id, action, body) => {
      if (!guid.test(id) || !['report', 'cancel', 'dispute'].includes(action))
        throw new Error('Invalid outcome action.');
      return request(`/api/agreements/${encodeURIComponent(id)}/outcome/${action}`, { body });
    },
    getConversationMessages: (id, cursor = {}) => {
      if (!guid.test(id)) throw new Error('Invalid agreement ID.');
      const params = new URLSearchParams({ pageSize: '30' });
      if (cursor.after !== undefined) params.set('after', String(cursor.after));
      if (cursor.before !== undefined) params.set('before', String(cursor.before));
      return request(
        `/api/agreements/${encodeURIComponent(id)}/conversation/messages?${params}`,
      );
    },
    sendConversationMessage: (id, text, idempotencyKey) => {
      if (!guid.test(id)) throw new Error('Invalid agreement ID.');
      return request(`/api/agreements/${encodeURIComponent(id)}/conversation/messages`, {
        body: { text, idempotencyKey },
      });
    },
    acknowledgeConversation: (id, deliveredThrough, readThrough) => {
      if (!guid.test(id)) throw new Error('Invalid agreement ID.');
      return request(`/api/agreements/${encodeURIComponent(id)}/conversation/receipt`, {
        body: { deliveredThrough, readThrough },
      });
    },
  };
}

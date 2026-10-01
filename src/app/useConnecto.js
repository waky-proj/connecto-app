import { useDiscovery } from '../features/discovery/index.js';
import { mapProfile } from '../features/members/index.js';
import { loadMemberActivity } from '../features/activity/index.js';
import { auth } from '../services/auth';
import { useEffect, useRef, useState } from 'react';
import { clearLegacyPrivateState, createSessionScope } from '../services/sessionScope';
import { initialOfferings } from '../shared/lib/matching.js';
import { createApiClient, needPayload, offeringPayload } from '../services/api';
const api = createApiClient({
  baseUrl: import.meta.env.VITE_CONNECTO_API_BASE_URL || '',
  getAccessToken: auth.getAccessToken,
  getSessionGeneration: auth.getSessionGeneration,
  onUnauthorized: auth.rejectAccessToken,
});
export default function useConnecto() {
  const [profile, setProfile] = useState(null),
    [offers, setOffers] = useState([]),
    [needs, setNeeds] = useState([]),
    [messages, setMessages] = useState({});
  const scope = useRef(createSessionScope());
  const [legacyCleared] = useState(() => {
    clearLegacyPrivateState();
    return true;
  });
  void legacyCleared;
  const [page, setPage] = useState(profile ? 'discover' : 'welcome'),
    [selected, setSelected] = useState(null),
    [modal, setModal] = useState(false),
    [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiMode, setApiMode] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const navigate = (p) => {
    setPage(p);
    setNotice('');
    setApiError('');
  };
  const discovery = useDiscovery({
    offers,
    page,
    api,
    scope: scope.current,
    navigate,
    setBusy,
    setApiError,
  });
  const {
    category,
    setCategory,
    query,
    setQuery,
    activeNeed,
    filterToday,
    setFilterToday,
    showMatches,
    results,
    filtered,
    resetDiscovery,
  } = discovery;
  function clearSession() {
    const generation = scope.current.reset();
    auth.logout();
    clearLegacyPrivateState();
    setProfile(null);
    setOffers([]);
    setNeeds([]);
    setMessages({});
    setSelected(null);
    resetDiscovery();
    setModal(false);
    setBusy(false);
    setApiError('');
    setNotice('');
    setSignedIn(false);
    setApiMode(true);
    return generation;
  }
  useEffect(() =>
    auth.onSessionExpired(() => {
      clearSession();
      navigate('login');
      setNotice('Your session expired. Please log in again.');
    }),
  );
  async function loadActivity(generation, member) {
    const data = await loadMemberActivity(api, member, () =>
      scope.current.isCurrent(generation),
    );
    if (data && scope.current.isCurrent(generation)) {
      setNeeds(data.needs);
      setOffers(data.offers);
    }
  }
  async function refreshActivity() {
    const generation = scope.current.capture();
    setBusy(true);
    setApiError('');
    try {
      await loadActivity(generation, profile);
    } catch (error) {
      if (scope.current.isCurrent(generation)) setApiError(error.message);
    } finally {
      if (scope.current.isCurrent(generation)) setBusy(false);
    }
  }
  async function saveProfile(data) {
    if (!signedIn) {
      setProfile({ ...profile, ...data });
      setModal(false);
      return;
    }
    const generation = scope.current.capture();
    setBusy(true);
    setApiError('');
    try {
      const [firstName, ...rest] = data.name.trim().split(/\s+/);
      const user = await api.updateProfile({
        firstName,
        lastName: rest.join(' '),
        city: data.neighborhood,
        bio: data.bio,
      });
      if (!scope.current.isCurrent(generation)) return;
      setProfile(mapProfile(user));
      setModal(false);
      setNotice('Profile saved to Connecto.');
    } catch (error) {
      if (scope.current.isCurrent(generation)) setApiError(error.message);
    } finally {
      if (scope.current.isCurrent(generation)) setBusy(false);
    }
  }
  async function login(credentials) {
    const generation = clearSession();
    await auth.login(credentials);
    if (!scope.current.isCurrent(generation)) return;
    try {
      const user = await api.getProfile();
      if (!scope.current.isCurrent(generation)) return;
      const member = mapProfile(user);
      setProfile(member);
      setSignedIn(true);
      setApiMode(true);
      navigate('gigs');
      setNotice('You are logged in.');
      setBusy(true);
      try {
        await loadActivity(generation, member);
      } catch (error) {
        if (scope.current.isCurrent(generation)) setApiError(error.message);
      } finally {
        if (scope.current.isCurrent(generation)) setBusy(false);
      }
    } catch (error) {
      if (!scope.current.isCurrent(generation)) return;
      clearSession();
      throw error;
    }
  }
  function logout() {
    clearSession();
    navigate('login');
  }
  function previewProfile(data) {
    clearSession();
    setOffers(initialOfferings);
    setProfile(data);
    setApiMode(false);
    navigate('discover');
    setNotice('Local preview profile ready.');
  }
  async function publishNeed(n) {
    const generation = scope.current.capture();
    setBusy(true);
    setApiError('');
    try {
      const response = apiMode
        ? await api.createNeed(needPayload(n, profile?.neighborhood || null))
        : { id: crypto.randomUUID() };
      if (!response?.id) throw new Error('The API did not return a Need ID.');
      if (!scope.current.isCurrent(generation)) return;
      const next = {
        ...n,
        ...response,
        source: apiMode ? 'api' : 'demo',
        createdAt: new Date().toISOString(),
      };
      setNeeds((current) => [...current, next]);
      await showMatches(next);
      if (!scope.current.isCurrent(generation)) return;
      setNotice(
        apiMode
          ? 'Your request was saved to Connecto API.'
          : 'Demo request saved on this device.',
      );
    } catch (error) {
      if (scope.current.isCurrent(generation)) setApiError(error.message);
    } finally {
      if (scope.current.isCurrent(generation)) setBusy(false);
    }
  }
  async function publishOffering(o) {
    const generation = scope.current.capture();
    setBusy(true);
    setApiError('');
    try {
      const response = apiMode
        ? await api.createOffering(offeringPayload(o, profile?.neighborhood || null))
        : { id: crypto.randomUUID() };
      if (!response?.id) throw new Error('The API did not return an Offering ID.');
      if (!scope.current.isCurrent(generation)) return;
      setOffers((current) => [
        ...current,
        {
          ...o,
          ...response,
          source: apiMode ? 'api' : 'demo',
          name: profile?.name || 'You',
          distance: 0,
          rating: 0,
          reviews: 0,
          emoji: '🤝',
        },
      ]);
      navigate('gigs');
      setNotice(
        apiMode
          ? 'Your offering was saved to Connecto API.'
          : 'Demo offering saved on this device.',
      );
    } catch (error) {
      if (scope.current.isCurrent(generation)) setApiError(error.message);
    } finally {
      if (scope.current.isCurrent(generation)) setBusy(false);
    }
  }
  const openOffer = (o) => {
    setSelected(o);
    navigate('detail');
  };
  const navVisible = ![
    'welcome',
    'register',
    'login',
    'need',
    'offer',
    'detail',
  ].includes(page);

  return {
    profile,
    setProfile,
    saveProfile,
    refreshActivity,
    offers,
    setOffers,
    needs,
    setNeeds,
    messages,
    setMessages,
    page,
    setPage,
    category,
    setCategory,
    query,
    setQuery,
    selected,
    setSelected,
    activeNeed,
    modal,
    setModal,
    notice,
    setNotice,
    filterToday,
    setFilterToday,
    busy,
    setBusy,
    apiError,
    setApiError,
    apiMode,
    setApiMode,
    signedIn,
    login,
    register: auth.register,
    confirm: auth.confirm,
    resend: auth.resend,
    logout,
    previewProfile,
    publishNeed,
    publishOffering,
    navigate,
    openOffer,
    showMatches,
    results,
    filtered,
    navVisible,
  };
}

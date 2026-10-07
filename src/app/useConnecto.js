import { useDiscovery } from '../features/discovery/index.js';
import {
  mapProfile,
  buildProfileUpdate,
  needsProfileSetup,
} from '../features/members/index.js';
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
  const [profileError, setProfileError] = useState('');
  const [profileBusy, setProfileBusy] = useState(false);
  const [apiMode, setApiMode] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [agreements, setAgreements] = useState([]);
  const [inboxBusy, setInboxBusy] = useState(false);
  const [inboxError, setInboxError] = useState('');
  const navigate = (p) => {
    if (['welcome', 'login', 'register'].includes(p)) clearSession();
    setPage(p);
    setNotice('');
    setApiError('');
    setProfileError('');
  };
  const discovery = useDiscovery({
    offers,
    page,
    api,
    scope: scope.current,
    navigate,
    setBusy,
    setApiError,
    apiMode,
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
    discoveryBusy,
    discoveryError,
    hasMore,
    loadMore,
    retryDiscovery,
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
    setConnectionRequests([]);
    setAgreements([]);
    setInboxError('');
    setSelected(null);
    resetDiscovery();
    setModal(false);
    setBusy(false);
    setApiError('');
    setNotice('');
    setProfileError('');
    setSignedIn(false);
    setProfileBusy(false);
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
    setProfileBusy(true);
    setProfileError('');
    try {
      const user = await api.updateProfile(buildProfileUpdate(data));
      if (!scope.current.isCurrent(generation)) return;
      setProfile(mapProfile(user));
      setModal(false);
      setNotice('Profile saved to Connecto.');
    } catch (error) {
      if (scope.current.isCurrent(generation)) setProfileError(error.message);
    } finally {
      if (scope.current.isCurrent(generation)) setProfileBusy(false);
    }
  }
  function setProfileModal(value) {
    setProfileError('');
    setModal(value);
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
      const setupRequired = needsProfileSetup(member);
      navigate(setupRequired ? 'profile' : 'gigs');
      setModal(setupRequired);
      setNotice(
        setupRequired
          ? 'You are logged in. Add your name and neighborhood to your profile.'
          : 'You are logged in.',
      );
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
  async function changeListingLifecycle(kind, listing, action) {
    if (!apiMode || !Number.isInteger(listing.revision)) return;
    const generation = scope.current.capture();
    setBusy(true);
    setApiError('');
    try {
      const response =
        kind === 'need'
          ? await api.changeNeedLifecycle(listing.id, action, listing.revision)
          : await api.changeOfferingLifecycle(listing.id, action, listing.revision);
      if (!scope.current.isCurrent(generation)) return;
      const update = (item) =>
        item.id === listing.id
          ? { ...item, status: response.status, revision: response.revision }
          : item;
      if (kind === 'need') setNeeds((current) => current.map(update));
      else setOffers((current) => current.map(update));
      setNotice(`Listing ${action === 'pause' ? 'paused' : 'closed'}.`);
    } catch (error) {
      if (scope.current.isCurrent(generation)) setApiError(error.message);
    } finally {
      if (scope.current.isCurrent(generation)) setBusy(false);
    }
  }
  function editListing(kind, listing) {
    setSelected({ kind, listing });
    navigate(kind === 'need' ? 'need-edit' : 'offer-edit');
  }
  async function saveListing(kind, values, listing) {
    const generation = scope.current.capture();
    setBusy(true);
    setApiError('');
    try {
      const body = {
        ...(kind === 'need'
          ? needPayload(values, listing.location || profile?.neighborhood || null)
          : offeringPayload(values, listing.location || profile?.neighborhood || null)),
        revision: listing.revision,
      };
      const response =
        kind === 'need'
          ? await api.updateNeed(listing.id, body)
          : await api.updateOffering(listing.id, body);
      if (!scope.current.isCurrent(generation)) return;
      const update = (item) =>
        item.id === listing.id ? { ...item, ...values, ...response } : item;
      if (kind === 'need') setNeeds((current) => current.map(update));
      else setOffers((current) => current.map(update));
      setSelected(null);
      navigate('gigs');
      setNotice('Listing saved.');
    } catch (error) {
      if (scope.current.isCurrent(generation)) setApiError(error.message);
    } finally {
      if (scope.current.isCurrent(generation)) setBusy(false);
    }
  }
  const openOffer = async (o) => {
    const generation = scope.current.capture();
    setSelected(o);
    navigate('detail');
    if (o.source !== 'api') return;
    try {
      const detail = await api.getOfferingDetail(o.id);
      if (scope.current.isCurrent(generation))
        setSelected((current) =>
          current?.id === o.id ? { ...current, ...detail } : current,
        );
    } catch (error) {
      if (scope.current.isCurrent(generation)) setApiError(error.message);
    }
  };
  async function blockMember(memberId) {
    const generation = scope.current.capture();
    await api.blockMember(memberId);
    if (!scope.current.isCurrent(generation)) return;
    setSelected(null);
    resetDiscovery();
    navigate('discover');
    setNotice('Member blocked. Their offerings are hidden from discovery.');
  }
  async function reportMember(body) {
    const generation = scope.current.capture();
    const report = await api.reportMember(body);
    if (scope.current.isCurrent(generation))
      setNotice('Report saved for operator review.');
    return report;
  }
  async function loadConnectionRequests() {
    const generation = scope.current.capture();
    setInboxBusy(true);
    setInboxError('');
    try {
      const all = [];
      let pageNumber = 1;
      while (scope.current.isCurrent(generation)) {
        const data = await api.getConnectionRequests(pageNumber);
        if (!scope.current.isCurrent(generation)) return;
        all.push(...data.requests);
        if (all.length >= data.total) break;
        pageNumber++;
      }
      if (scope.current.isCurrent(generation)) setConnectionRequests(all);
      const agreementRows = await api.getAgreements();
      if (scope.current.isCurrent(generation)) setAgreements(agreementRows);
    } catch (error) {
      if (scope.current.isCurrent(generation)) setInboxError(error.message);
    } finally {
      if (scope.current.isCurrent(generation)) setInboxBusy(false);
    }
  }
  useEffect(() => {
    if (page === 'inbox' && signedIn && apiMode) loadConnectionRequests();
  }, [page, signedIn, apiMode]);
  async function createConnectionRequest(body) {
    const generation = scope.current.capture();
    const item = await api.createConnectionRequest(body);
    if (!scope.current.isCurrent(generation)) return;
    setConnectionRequests((current) => [item, ...current]);
    navigate('inbox');
    setNotice(
      'Connection request saved. The provider can accept or decline the proposed terms.',
    );
    return item;
  }
  async function decideConnectionRequest(id, action, revision) {
    const generation = scope.current.capture();
    const item = await api.decideConnectionRequest(id, action, revision);
    if (!scope.current.isCurrent(generation)) return;
    setConnectionRequests((current) =>
      current.map((old) => (old.id === id ? item : old)),
    );
    return item;
  }
  async function acceptConnectionRequest(id, revision) {
    const generation = scope.current.capture();
    const agreement = await api.acceptConnectionRequest(
      id,
      revision,
      `${id}:${revision}`,
    );
    if (!scope.current.isCurrent(generation)) return;
    setAgreements((current) => [
      agreement,
      ...current.filter((item) => item.id !== agreement.id),
    ]);
    await loadConnectionRequests();
    if (scope.current.isCurrent(generation)) setNotice('Agreement accepted and saved.');
    return agreement;
  }
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
    setModal: setProfileModal,
    notice,
    setNotice,
    filterToday,
    setFilterToday,
    busy,
    setBusy,
    apiError,
    profileError,
    profileBusy,
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
    changeListingLifecycle,
    editListing,
    saveListing,
    navigate,
    openOffer,
    blockMember,
    reportMember,
    connectionRequests,
    agreements,
    inboxBusy,
    inboxError,
    loadConnectionRequests,
    createConnectionRequest,
    decideConnectionRequest,
    acceptConnectionRequest,
    getConversationMessages: api.getConversationMessages,
    sendConversationMessage: api.sendConversationMessage,
    acknowledgeConversation: api.acknowledgeConversation,
    getBlocks: api.getBlocks,
    unblockMember: api.unblockMember,
    getOwnReports: api.getOwnReports,
    getOperatorCases: api.getOperatorCases,
    reviewOperatorCase: api.reviewOperatorCase,
    showMatches,
    results,
    filtered,
    discoveryBusy,
    discoveryError,
    hasMore,
    loadMore,
    retryDiscovery,
    navVisible,
  };
}

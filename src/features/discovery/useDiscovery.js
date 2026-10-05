import { useEffect, useState } from 'react';
import { rankMatches } from '../../shared/lib/matching.js';
import { normalizeMatches } from '../../shared/lib/matchView.js';
import { mapDiscoveryOffer } from './offerView.js';

export default function useDiscovery({
  offers,
  page,
  api,
  scope,
  navigate,
  setBusy,
  setApiError,
  apiMode,
}) {
  const [category, updateCategory] = useState('Garden');
  const [query, updateQuery] = useState('');
  const [activeNeed, setActiveNeed] = useState(null);
  const [filterToday, updateFilterToday] = useState(false);
  const [apiMatches, setApiMatches] = useState([]);
  const [discovered, setDiscovered] = useState([]);
  const [discoveryBusy, setDiscoveryBusy] = useState(false);
  const [discoveryError, setDiscoveryError] = useState('');
  const [discoveryPage, setDiscoveryPage] = useState(1);
  const [discoveryTotal, setDiscoveryTotal] = useState(0);
  const [retryKey, setRetryKey] = useState(0);
  const resetSearch = () => { setDiscoveryPage(1); setDiscovered([]); setDiscoveryTotal(0); };
  const setCategory = (value) => { resetSearch(); updateCategory(value); };
  const setQuery = (value) => { resetSearch(); updateQuery(value); };
  const setFilterToday = (value) => { resetSearch(); updateFilterToday(value); };

  useEffect(() => {
    if (!apiMode || !['discover', 'helpers'].includes(page)) return;
    const generation = scope.capture();
    let cancelled = false;
    const timer = setTimeout(async () => {
      setDiscoveryBusy(true);
      setDiscoveryError('');
      try {
        const data = await api.searchOfferings({
          query,
          category: page === 'helpers' ? category : '',
          availableToday: filterToday,
          page: discoveryPage,
        });
        if (!cancelled && scope.isCurrent(generation)) {
          const next = data.offerings.map(mapDiscoveryOffer);
          setDiscovered(current => discoveryPage === 1 ? next : [...current, ...next]);
          setDiscoveryTotal(data.total);
        }
      } catch (error) {
        if (!cancelled && scope.isCurrent(generation)) {
          setDiscovered([]);
          setDiscoveryError(error.message);
        }
      } finally {
        if (!cancelled && scope.isCurrent(generation)) setDiscoveryBusy(false);
      }
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [api, apiMode, category, discoveryPage, filterToday, page, query, retryKey, scope]);

  function resetDiscovery() {
    updateCategory('Garden');
    updateQuery('');
    setActiveNeed(null);
    updateFilterToday(false);
    setDiscoveryPage(1);
    setDiscoveryTotal(0);
    setApiMatches([]);
    setDiscovered([]);
    setDiscoveryError('');
  }
  async function showMatches(need) {
    const generation = scope.capture();
    setActiveNeed(need);
    setCategory(need.category);
    setApiMatches([]);
    navigate('matches');
    if (need.source !== 'api') return;
    setBusy(true);
    try {
      const matches = await api.getMatches(need.id);
      if (scope.isCurrent(generation))
        setApiMatches(normalizeMatches(matches, offers, need));
    } catch (error) {
      if (scope.isCurrent(generation)) setApiError(error.message);
    } finally {
      if (scope.isCurrent(generation)) setBusy(false);
    }
  }
  const results =
    activeNeed?.source === 'api'
      ? apiMatches
      : activeNeed
        ? rankMatches(
            activeNeed,
            offers.filter((o) => o.source !== 'api'),
          )
        : [];
  const filtered = apiMode ? discovered : offers.filter(
    (o) =>
      (page !== 'helpers' || o.category === category) &&
      (!filterToday || o.availability === 'Today') &&
      `${o.title} ${o.name} ${o.category}`.toLowerCase().includes(query.toLowerCase()),
  );
  return {
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
    hasMore: apiMode && discovered.length < discoveryTotal,
    loadMore: () => setDiscoveryPage(page => page + 1),
    retryDiscovery: () => setRetryKey(key => key + 1),
    resetDiscovery,
  };
}

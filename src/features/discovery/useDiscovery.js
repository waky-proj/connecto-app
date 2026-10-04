import { useState } from 'react';
import { rankMatches } from '../../shared/lib/matching.js';
import { normalizeMatches } from '../../shared/lib/matchView.js';

export default function useDiscovery({
  offers,
  page,
  api,
  scope,
  navigate,
  setBusy,
  setApiError,
}) {
  const [category, setCategory] = useState('Garden');
  const [query, setQuery] = useState('');
  const [activeNeed, setActiveNeed] = useState(null);
  const [filterToday, setFilterToday] = useState(false);
  const [apiMatches, setApiMatches] = useState([]);

  function resetDiscovery() {
    setCategory('Garden');
    setQuery('');
    setActiveNeed(null);
    setFilterToday(false);
    setApiMatches([]);
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
  const filtered = offers.filter(
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
    resetDiscovery,
  };
}

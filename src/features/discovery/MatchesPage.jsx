import { SlidersHorizontal } from 'lucide-react';
import Header from '../../shared/ui/Header.jsx';
import SearchBox from '../../shared/ui/SearchBox.jsx';
import Empty from '../../shared/ui/Empty.jsx';
import OfferCard from '../../shared/ui/OfferCard.jsx';
export default function MatchesPage({
  page,
  category,
  query,
  setQuery,
  activeNeed,
  filterToday,
  setFilterToday,
  busy,
  apiError,
  navigate,
  openOffer,
  results,
  filtered,
  apiMode,
  discoveryBusy,
  discoveryError,
  hasMore,
  loadMore,
  retryDiscovery,
  retryMatches,
}) {
  return (
    <>
      <Header
        title={
          page === 'matches'
            ? 'Your ranked matches'
            : `${category} Offerings`
        }
        back={() => navigate('discover')}
        right={
          <button
            aria-label="Toggle available today filter"
            className={filterToday ? 'selected-filter' : ''}
            onClick={() => setFilterToday(!filterToday)}
          >
            <SlidersHorizontal size={19} />
          </button>
        }
      />
      {page === 'matches' ? (
        <div className="need-summary">
          <small>MATCHING FOR</small>
          <h2>{activeNeed?.title}</h2>
          <p>
            {activeNeed?.timeframe || 'Timeframe not stated'} · {
              activeNeed?.pricingBasis === 'free' || activeNeed?.pricingBasis === 3 ? 'Free'
                : activeNeed?.pricingBasis === 'negotiable' || activeNeed?.pricingBasis === 4 ? 'Negotiable'
                  : `NZ$${activeNeed?.budget ?? activeNeed?.budgetMax ?? 'unknown'} ${activeNeed?.pricingBasis === 'hourly' || activeNeed?.pricingBasis === 2 ? 'maximum hourly rate' : 'maximum fixed total'}`
            }
            {(activeNeed?.pricingBasis === 'hourly' || activeNeed?.pricingBasis === 2) &&
              ` · ${activeNeed?.hours ?? activeNeed?.estimatedHours ?? 'unknown'} estimated hours`}
          </p>
          <small>{activeNeed?.source === 'api' ? 'Scores show configured factors and known listing data.' : 'Demo scores use category, budget, availability, distance, tools, and rating.'}</small>
        </div>
      ) : (
        <>
          <SearchBox query={query} setQuery={setQuery} />
          <div className="chips">
            <span>{category}</span>
            <button onClick={() => setFilterToday(!filterToday)}>
              {filterToday ? '✓ ' : ''}Available Today
            </button>
          </div>
        </>
      )}
      <p className="muted">
        {page === 'matches' ? results.length : filtered.length} neighbors offering
        relevant skills
      </p>
      {apiMode && page === 'helpers' && discoveryBusy && <p className="muted">Searching offerings…</p>}
      {apiMode && page === 'helpers' && discoveryError && <p role="alert">{discoveryError}</p>}
      {apiMode && page === 'helpers' && discoveryError && <button className="secondary" onClick={retryDiscovery}>Try again</button>}
      {page === 'matches' && apiError && <button className="secondary" onClick={retryMatches}>Retry matches</button>}
      {(page === 'matches' ? results : filtered).map((o, index) => (
        <OfferCard
          key={o.id}
          offer={o}
          rank={page === 'matches' ? index + 1 : null}
          onClick={() => openOffer(o)}
        />
      ))}
      {(page === 'matches'
        ? !busy && !apiError && !results.length
        : !discoveryBusy && !discoveryError && !filtered.length) && (
        <Empty text="No offerings match this search yet. Try a different category or publish an offering." />
      )}
      {page === 'helpers' && apiMode && hasMore && !discoveryBusy &&
        <button className="secondary" onClick={loadMore}>Load more offerings</button>}
    </>
  );
}

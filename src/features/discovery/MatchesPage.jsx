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
}) {
  return (
    <>
      <Header
        title={
          page === 'matches'
            ? 'Your ranked matches'
            : `${category === 'Garden' ? 'Garden' : category} Helpers`
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
            {activeNeed?.timeframe} · ${activeNeed?.budget} budget · {activeNeed?.hours}{' '}
            hour(s)
          </p>
          <small>
            {activeNeed?.source === 'api'
              ? 'Backend scores use skills, requirements, availability, budget, location, experience, and reputation.'
              : 'Demo scores use category, budget, availability, distance, tools, and rating.'}
          </small>
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
        : !filtered.length) && (
        <Empty text="No offerings match this search yet. Try a different category or publish an offering." />
      )}
    </>
  );
}

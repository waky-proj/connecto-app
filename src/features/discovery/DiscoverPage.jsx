import { Search, MapPin, Plus } from 'lucide-react';
import SearchBox from '../../shared/ui/SearchBox.jsx';
import Empty from '../../shared/ui/Empty.jsx';
import OfferCard from '../../shared/ui/OfferCard.jsx';
import { categories } from '../../shared/lib/matching.js';
import { categoryIcons as icons } from '../../shared/lib/categories.js';
export default function DiscoverPage({
  profile,
  offers,
  needs,
  setCategory,
  query,
  setQuery,
  navigate,
  openOffer,
  filtered,
}) {
  return (
    <>
      <header className="home-header">
        <div className="avatar">{(profile?.name || 'Clara Miller').slice(0, 1)}</div>
        <div>
          <small>Welcome back,</small>
          <b>{profile?.name || 'Clara Miller'}</b>
        </div>
        <span className="location">
          <MapPin size={12} />
          {profile?.neighborhood || 'Sunset Valley'}
        </span>
      </header>
      <SearchBox query={query} setQuery={setQuery} />
      <section>
        <h2>Explore Categories</h2>
        <div className="categories">
          {categories.map((c) => {
            const I = icons[c];
            return (
              <button
                key={c}
                onClick={() => {
                  setCategory(c);
                  setQuery('');
                  navigate('helpers');
                }}
              >
                <span>
                  <I size={22} />
                </span>
                {c}
              </button>
            );
          })}
        </div>
      </section>
      <section>
        <div className="section-heading">
          <h2>{query ? 'Search results' : 'Highly Rated Nearby'}</h2>
          <button
            className="text-button"
            onClick={() => {
              setCategory('Garden');
              navigate('helpers');
            }}
          >
            View all
          </button>
        </div>
        {(query
          ? filtered
          : [offers[0], offers.find((o) => o.id === 'elena')].filter(Boolean)
        ).map((o) => (
          <OfferCard key={o.id} offer={o} onClick={() => openOffer(o)} />
        ))}
        {query && !filtered.length && (
          <Empty text="No neighbors found. Try another skill or name." />
        )}
      </section>
      <section>
        <h2>Active Help Requests Nearby</h2>
        <div className="neighborhood-map">
          <span>🌳</span>
          <span>🏡</span>
          <span>🌳</span>
          <span>🏠</span>
          <span>🏡</span>
          <span>🏠</span>
          <MapPin className="pin p1" />
          <MapPin className="pin p2" />
          <MapPin className="pin p3" />
          <div className="map-label">
            <i />
            {needs.length + 12} requests near you
          </div>
        </div>
        <p className="muted">Illustrative neighborhood map · Sunset Valley</p>
      </section>
      <div className="action-row">
        <button className="primary" onClick={() => navigate('need')}>
          <Plus size={16} />
          Request help
        </button>
        <button className="secondary" onClick={() => navigate('offer')}>
          Offer your skills
        </button>
      </div>
    </>
  );
}

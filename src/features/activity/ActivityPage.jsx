import Header from '../../shared/ui/Header.jsx';
import Empty from '../../shared/ui/Empty.jsx';
import OfferCard from '../../shared/ui/OfferCard.jsx';
import { initialOfferings } from '../../shared/lib/matching.js';
export default function ActivityPage({
  offers,
  needs,
  navigate,
  openOffer,
  showMatches,
  onRefresh,
  busy,
}) {
  return (
    <>
      <Header title="My Activity" />
      {onRefresh && (
        <button className="secondary" disabled={busy} onClick={onRefresh}>
          Refresh activity
        </button>
      )}
      <section>
        <div className="section-heading">
          <h2>Your Help Requests</h2>
          <button className="text-button" onClick={() => navigate('need')}>
            + New
          </button>
        </div>
        {needs.length ? (
          needs.map((n) => (
            <button className="activity-card" key={n.id} onClick={() => showMatches(n)}>
              <span className="tag">{n.category}</span>
              <h3>{n.title}</h3>
              <p>
                {n.budget == null
                  ? 'Budget not specified'
                  : `Budget ${n.budget} (pricing basis not yet specified)`}
              </p>
              <b>View ranked matches →</b>
            </button>
          ))
        ) : (
          <Empty text="You haven’t posted a request yet." />
        )}
      </section>
      <section>
        <div className="section-heading">
          <h2>Your Offerings</h2>
          <button className="text-button" onClick={() => navigate('offer')}>
            + New
          </button>
        </div>
        {offers
          .filter((o) => !initialOfferings.some((seed) => seed.id === o.id))
          .map((o) => (
            <OfferCard key={o.id} offer={o} onClick={() => openOffer(o)} />
          ))}
        {!offers.some((o) => !initialOfferings.some((seed) => seed.id === o.id)) && (
          <Empty text="Share a skill to help a neighbor." />
        )}
      </section>
    </>
  );
}

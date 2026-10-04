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
  onLifecycle,
  onEdit,
  apiMode,
  busy,
}) {
  const state = (value) =>
    ({ 0: 'Draft', 1: 'Published', 2: 'Paused', 3: 'Closed', published: 'Published', paused: 'Paused', closed: 'Closed' }[value] || 'Legacy listing');
  const actions = (kind, item) =>
    apiMode && Number.isInteger(item.revision) && (item.status === 1 || item.status === 2 || item.status === 'Published' || item.status === 'Paused') ? (
      <div className="listing-actions">
        <button className="secondary" disabled={busy} onClick={() => onEdit(kind, item)}>Edit</button>
        {item.status === 1 || item.status === 'Published' ? (
          <button className="secondary" disabled={busy} onClick={() => onLifecycle(kind, item, 'pause')}>Pause</button>
        ) : null}
        <button className="secondary" disabled={busy} onClick={() => onLifecycle(kind, item, 'close')}>Close</button>
      </div>
    ) : null;
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
            <div className="activity-card" key={n.id}>
              <span className="tag">{n.category}</span>
              <h3>{n.title}</h3>
              <p>
                {n.budget == null
                  ? 'Budget not specified'
                  : `Budget ${n.budget} ${n.currency || ''} (${n.pricingBasis || 'legacy pricing'})`}
              </p>
              <p>{state(n.status)}</p>
              <button className="text-button" onClick={() => showMatches(n)}>View ranked matches →</button>
              {actions('need', n)}
            </div>
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
            <div key={o.id}>
              <OfferCard offer={o} onClick={() => openOffer(o)} />
              <p>{state(o.status)}</p>
              {actions('offering', o)}
            </div>
          ))}
        {!offers.some((o) => !initialOfferings.some((seed) => seed.id === o.id)) && (
          <Empty text="Share a skill to help a neighbor." />
        )}
      </section>
    </>
  );
}

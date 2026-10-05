import { MessageSquare, Star, Check, ShieldCheck } from 'lucide-react';
import Header from '../../shared/ui/Header.jsx';
export default function OfferingDetailPage({ selected, activeNeed, navigate }) {
  return (
    <>
      <Header
        title={selected.title}
        back={() => navigate(activeNeed ? 'matches' : 'helpers')}
      />
      <div className="garden-cover">
        <span>{selected.emoji}</span>
        <b>
          {selected.source === 'api'
            ? selected.pricingBasis === 'free' || selected.pricingBasis === 3 ? 'Free'
              : selected.pricingBasis === 'negotiable' || selected.pricingBasis === 4 ? 'Negotiable'
                : selected.rate == null ? 'Price unavailable' : `NZ$${selected.rate}`
            : selected.rate == null ? 'Rate unavailable' : `${selected.rate}`}
          <small>{selected.rate != null && (selected.pricingBasis === 'hourly' || selected.pricingBasis === 2 || selected.source !== 'api') && ' / hr'}</small>
        </b>
      </div>
      <div className="person-heading">
        <div className="avatar large">{(selected.name || 'Member').charAt(0)}</div>
        <div>
          <h2>{selected.name || 'Member'}</h2>
          <p className="muted">
            {selected.distance == null
              ? selected.location || (selected.remoteAvailable ? 'Remote available' : 'Location unknown')
              : `Local helper · ${selected.distance} miles away`}
          </p>
        </div>
      </div>
      <div className="chips green-chips">
        <span>
          <ShieldCheck size={13} />
          {selected.source === 'api' ? 'API offering' : 'Demo community member'}
        </span>
        {selected.tools != null && (
          <span>{selected.tools ? 'Tools included' : 'Bring your tools'}</span>
        )}
      </div>
      <section>
        <h2>About the Offer</h2>
        <p className="body-copy">{selected.description}</p>
      </section>
      {selected.reasons && (
        <section className="explanation">
          <div className="section-heading">
            <h2>Why this match?</h2>
            <b>{selected.score}%</b>
          </div>
          <ul>
            {selected.reasons.map((r) => (
              <li key={r}>
                <Check size={15} />
                {r}
              </li>
            ))}
          </ul>
          {selected.unknowns?.length > 0 && (
            <p className="muted">Not yet known: {selected.unknowns.join('; ')}.</p>
          )}
          <p className="muted">
            {selected.source === 'api' ? `Backend match score · ${selected.policyVersion || 'policy unknown'}` : 'Rule-based POC score'},
            not a guarantee. Confirm details with your neighbor.
          </p>
        </section>
      )}
      {selected.source !== 'api' && (
        <section>
          <h2>What neighbors say</h2>
          <div className="review">
            <b>Sarah Jenkins</b>
            <span>
              <Star size={14} />
              {selected.rating}
            </span>
            <p>
              “Such a helpful neighbor. Friendly, thoughtful, and a pleasure to work
              with.”
            </p>
            <small>Illustrative POC review · {selected.reviews} sample reviews</small>
          </div>
        </section>
      )}
      <div className="sticky-action">
        <button
          className="primary"
          disabled={selected.source === 'api'}
          onClick={() => navigate('chat')}
        >
          <MessageSquare size={17} />
          Discuss & Coordinate
        </button>
        {selected.source === 'api' && (
          <p className="muted">
            Messaging is unavailable for API matches until the backend provides owner and
            conversation endpoints.
          </p>
        )}
      </div>
    </>
  );
}

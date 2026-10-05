import { MessageSquare, Star, Check, ShieldCheck } from 'lucide-react';
import Header from '../../shared/ui/Header.jsx';
import { useState } from 'react';
export default function OfferingDetailPage({ selected, activeNeed, navigate, onBlock, onReport }) {
  const [reason, setReason] = useState('unsafe');
  const [details, setDetails] = useState('');
  const [safetyBusy, setSafetyBusy] = useState(false);
  const [safetyError, setSafetyError] = useState('');
  const [reported, setReported] = useState(false);
  async function submitReport(event) {
    event.preventDefault();
    setSafetyBusy(true);
    setSafetyError('');
    try {
      await onReport({ subjectId: selected.memberId, offeringId: selected.id, reason, details });
      setReported(true);
      setDetails('');
    } catch (error) { setSafetyError(error.message); }
    finally { setSafetyBusy(false); }
  }
  async function block() {
    setSafetyBusy(true);
    setSafetyError('');
    try { await onBlock(selected.memberId); }
    catch (error) { setSafetyError(error.message); setSafetyBusy(false); }
  }
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
      {selected.source === 'api' && selected.memberId && (
        <section className="safety-panel">
          <h2>Safety</h2>
          <p className="muted">Block this member to hide each other’s offerings from discovery. You can also send a private report for operator review without completing a connection.</p>
          <button className="secondary" type="button" disabled={safetyBusy} onClick={block}>Block member</button>
          <form onSubmit={submitReport}>
            <label htmlFor="report-reason">Report reason</label>
            <select id="report-reason" value={reason} onChange={(event) => setReason(event.target.value)}>
              <option value="unsafe">Unsafe behaviour</option>
              <option value="harassment">Harassment</option>
              <option value="fraud">Fraud or misleading activity</option>
              <option value="other">Other concern</option>
            </select>
            <label htmlFor="report-details">What happened?</label>
            <textarea id="report-details" value={details} onChange={(event) => setDetails(event.target.value)} maxLength={2000} required rows={4} />
            <button className="secondary" type="submit" disabled={safetyBusy || !details.trim()}>Send private report</button>
          </form>
          {reported && <p role="status">Report saved for operator review.</p>}
          {safetyError && <p role="alert">{safetyError}</p>}
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

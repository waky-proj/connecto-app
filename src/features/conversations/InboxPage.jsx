import { useState } from 'react';
import Header from '../../shared/ui/Header.jsx';
import Empty from '../../shared/ui/Empty.jsx';

export default function InboxPage({ offers, messages, setSelected, navigate, signedIn, apiMode,
  requests = [], agreements = [], busy, error, onRefresh, onDecision, onAccept, profileId }) {
  const [actionId, setActionId] = useState(null);
  const [actionError, setActionError] = useState('');
  async function decide(item, action) {
    setActionId(item.id);
    setActionError('');
    try { await onDecision(item.id, action, item.revision); }
    catch (failure) { setActionError(failure.message); }
    finally { setActionId(null); }
  }
  async function accept(item) {
    setActionId(item.id);
    setActionError('');
    try { await onAccept(item.id, item.revision); }
    catch (failure) { setActionError(failure.message); }
    finally { setActionId(null); }
  }
  return (
    <>
      <Header title="Inbox" />
      {signedIn && apiMode ? <>
        <button className="secondary" type="button" disabled={busy} onClick={onRefresh}>Refresh requests</button>
        {busy && <p role="status">Loading requests…</p>}
        {error && <p role="alert">{error}</p>}
        {actionError && <p role="alert">{actionError}</p>}
        {!busy && !error && !requests.length && !agreements.length && <Empty text="No connection requests or agreements yet." />}
        {agreements.length > 0 && <section aria-label="Agreements">
          <h2>Agreements</h2>
          {agreements.map((item) => <article className="activity-card" key={item.id}>
            <span className="tag">Accepted agreement</span>
            <h3>{item.needTitle} → {item.offeringTitle}</h3>
            <p>{item.terms}</p>
            <p><b>{item.pricingBasis === 3 ? 'Free' : item.pricingBasis === 4 ? 'Negotiable' : `NZ$${item.agreedAmount}${item.pricingBasis === 2 ? ' per hour' : ' fixed'}`}</b></p>
            <p className="muted">Accepted {new Date(item.acceptedAt).toLocaleString()} · Need revision {item.needRevision} · Offering revision {item.offeringRevision}</p>
          </article>)}
        </section>}
        {requests.map((item) => {
          const incoming = item.recipientId === profileId;
          const price = item.pricingBasis === 3 ? 'Free' : item.pricingBasis === 4 ? 'Negotiable'
            : `NZ$${item.proposedAmount}${item.pricingBasis === 2 ? ' per hour' : ' fixed'}`;
          return <article className="activity-card" key={item.id}>
            <span className="tag">{incoming ? 'Received' : 'Sent'} · {item.status}</span>
            <h3>{item.needTitle} → {item.offeringTitle}</h3>
            <p>{item.terms}</p>
            <p><b>{price}</b> · Proposed {new Date(item.createdAt).toLocaleString()}</p>
            <p className="muted">Based on Need revision {item.needRevision} and Offering revision {item.offeringRevision}.</p>
            {item.status === 'pending' && <div className="listing-actions">
              {incoming ? <><button disabled={actionId === item.id} onClick={() => accept(item)}>Accept terms</button><button className="secondary" disabled={actionId === item.id} onClick={() => decide(item, 'decline')}>Decline</button></>
                : <button className="secondary" disabled={actionId === item.id} onClick={() => decide(item, 'withdraw')}>Withdraw</button>}
            </div>}
          </article>;
        })}
      </> : Object.keys(messages).length ? (
        Object.keys(messages).map((id) => {
          const offer = offers.find((item) => item.id === id);
          return offer && <button className="activity-card" key={id} onClick={() => { setSelected(offer); navigate('chat'); }}>
            <b>{offer.name}</b><p>{messages[id].at(-1)?.text}</p>
          </button>;
        })
      ) : <Empty text="No demo conversations yet. Find a neighbor and tap Discuss & Coordinate." />}
    </>
  );
}

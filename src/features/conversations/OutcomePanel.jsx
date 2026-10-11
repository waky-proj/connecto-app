import { useCallback, useEffect, useRef, useState } from 'react';
import MediaAttachments from './MediaAttachments.jsx';

const labels = {
  awaiting_confirmation: 'Awaiting reports',
  one_reported: 'One participant reported',
  both_confirmed: 'Both confirmed completion',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};

export default function OutcomePanel({ agreement, profileId, getOutcome, changeOutcome,
  uploadMedia, getAgreementMedia, getMediaContent, withdrawMedia }) {
  const [state, setState] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState('');
  const [outcome, setOutcome] = useState('completed');
  const pending = useRef(null);
  const [evidence, setEvidence] = useState([]);
  const [file, setFile] = useState(null);

  const refresh = useCallback(async () => {
    setError('');
    try {
      const [next, assets] = await Promise.all([getOutcome(agreement.id), getAgreementMedia(agreement.id)]);
      setState(next); setEvidence(assets.filter(item => item.purpose === 'case'));
    }
    catch (failure) { setError(failure.message); }
  }, [agreement.id, getOutcome, getAgreementMedia]);
  useEffect(() => { refresh(); }, [refresh]);

  async function act(action) {
    if (!state || busy) return;
    setBusy(true);
    setError('');
    try {
      const signature = JSON.stringify([agreement.id, action, state.outcomeRevision, outcome, reason.trim()]);
      if (pending.current?.signature !== signature)
        pending.current = { signature, key: crypto.randomUUID() };
      const body = {
        revision: state.outcomeRevision,
        idempotencyKey: pending.current.key,
        outcome: action === 'report' ? outcome : null,
        reason: reason.trim() || null,
      };
      setState(await changeOutcome(agreement.id, action, body));
      pending.current = null;
      setReason('');
    } catch (failure) {
      setError(failure.message);
      try { setState(await getOutcome(agreement.id)); } catch { /* retain error */ }
    } finally { setBusy(false); }
  }

  async function uploadEvidence() {
    if (!file) return;
    setBusy(true); setError('');
    try { await uploadMedia(agreement.id, 'case', 'evidence', file); setFile(null); await refresh(); }
    catch (failure) { setError(`${failure.message} The dispute remains available without an image.`); await refresh(); }
    finally { setBusy(false); }
  }
  async function removeEvidence(id) {
    setBusy(true); setError('');
    try { await withdrawMedia(id); await refresh(); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  const ownReport = profileId === agreement.requesterId
    ? state?.requesterReport : state?.providerReport;
  return <section aria-label="Agreement outcome">
    <h4>Outcome</h4>
    <button type="button" className="secondary" onClick={refresh}>Refresh outcome</button>
    {error && <p role="alert">{error}</p>}
    {!state ? <p role="status">Loading outcome…</p> : <>
      <p role="status">{labels[state.outcomeState] || state.outcomeState} · revision {state.outcomeRevision}</p>
      <p>Requester: {state.requesterReport || 'No report'} · Provider: {state.providerReport || 'No report'}</p>
      {state.outcomeState === 'disputed' && <p>{state.disputeReviewedAt ? 'Operator review recorded' : 'Awaiting operator review'}</p>}
      {state.outcomeState === 'disputed' && <section aria-label="Private case evidence">
        <h5>Private case evidence</h5>
        <p className="muted">Only you and authorised case staff can view your evidence. It is never added to a public review.</p>
        <label htmlFor={`case-file-${agreement.id}`}>Evidence image</label>
        <input id={`case-file-${agreement.id}`} type="file" accept="image/jpeg,image/png,image/webp"
          onChange={event => setFile(event.target.files?.[0] || null)} />
        <button type="button" className="secondary" disabled={busy || !file} onClick={uploadEvidence}>Upload private evidence</button>
        <MediaAttachments assets={evidence} getMediaContent={getMediaContent}
          onWithdraw={removeEvidence} busy={busy} />
      </section>}
      <label htmlFor={`outcome-${agreement.id}`}>Your completion report</label>
      <select id={`outcome-${agreement.id}`} value={outcome} onChange={event => setOutcome(event.target.value)}>
        <option value="completed">Completed</option>
        <option value="incomplete">Incomplete</option>
      </select>
      <label htmlFor={`reason-${agreement.id}`}>Reason (required for cancellation or dispute)</label>
      <textarea id={`reason-${agreement.id}`} maxLength={1000} value={reason}
        onChange={event => setReason(event.target.value)} />
      <div className="listing-actions">
        <button type="button" disabled={busy || !!ownReport || ['cancelled', 'disputed'].includes(state.outcomeState)}
          onClick={() => act('report')}>Submit my report</button>
        <button type="button" className="secondary" disabled={busy || !reason.trim() || ['cancelled', 'disputed', 'both_confirmed'].includes(state.outcomeState)}
          onClick={() => act('cancel')}>Cancel engagement</button>
        <button type="button" className="secondary" disabled={busy || !reason.trim() || state.outcomeState === 'disputed'}
          onClick={() => act('dispute')}>Open dispute</button>
      </div>
      <h5>History</h5>
      {!state.history.length && <p>No outcome actions yet.</p>}
      <ol>{state.history.map(entry => <li key={entry.id}>
        {entry.actorId === agreement.requesterId ? 'Requester' : entry.actorId === agreement.providerId ? 'Provider' : 'Operator'}: {entry.action}
        {entry.reportedOutcome && ` · ${entry.reportedOutcome}`}
        {entry.reason && ` · ${entry.reason}`} · {new Date(entry.createdAt).toLocaleString()}
      </li>)}</ol>
    </>}
  </section>;
}

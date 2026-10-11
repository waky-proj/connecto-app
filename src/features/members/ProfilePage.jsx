import Header from '../../shared/ui/Header.jsx';
import Empty from '../../shared/ui/Empty.jsx';
import { useEffect, useState } from 'react';
import { MediaAttachments } from '../conversations/index.js';
export default function ProfilePage({
  profile,
  signedIn,
  onLogout,
  setModal,
  apiMode,
  setApiMode,
  navigate,
  getBlocks,
  unblockMember,
  getOwnReports,
  getOperatorCases,
  getPilotMetrics,
  reviewOperatorCase,
  getMediaContent,
  excludeMedia,
  getCaseEvidence,
  getOutcomeDisputes,
  reviewOutcomeDispute,
}) {
  const [blocked, setBlocked] = useState([]);
  const [reports, setReports] = useState([]);
  const [safetyError, setSafetyError] = useState('');
  const [cases, setCases] = useState(null);
  const [pilotMetrics, setPilotMetrics] = useState(null);
  const [pilotWindow, setPilotWindow] = useState(() => {
    const today = new Date();
    return { from: new Date(today.getTime() - 30 * 86400000).toISOString().slice(0, 10), to: new Date(today.getTime() + 86400000).toISOString().slice(0, 10) };
  });
  const [disputes, setDisputes] = useState(null);
  const [caseEvidence, setCaseEvidence] = useState({});
  const [reviewNotes, setReviewNotes] = useState({});
  const [removalReasons, setRemovalReasons] = useState({});
  useEffect(() => {
    if (!signedIn) return;
    let current = true;
    Promise.all([getBlocks(), getOwnReports()])
      .then(([blocks, ownReports]) => {
        if (current) {
          setBlocked(blocks.memberIds);
          setReports(ownReports);
        }
      })
      .catch((error) => {
        if (current) setSafetyError(error.message);
      });
    return () => {
      current = false;
    };
  }, [signedIn, getBlocks, getOwnReports]);
  async function unblock(id) {
    try {
      await unblockMember(id);
      setBlocked((items) => items.filter((value) => value !== id));
    } catch (error) {
      setSafetyError(error.message);
    }
  }
  async function loadCases() {
    try {
      setSafetyError('');
      setCases(await getOperatorCases());
    } catch (error) {
      setCases(null);
      setSafetyError(error.message);
    }
  }
  async function loadPilotMetrics() {
    try {
      setSafetyError('');
      setPilotMetrics(await getPilotMetrics(`${pilotWindow.from}T00:00:00Z`, `${pilotWindow.to}T00:00:00Z`));
    } catch (error) {
      setPilotMetrics(null);
      setSafetyError(error.message);
    }
  }
  async function review(id) {
    try {
      await reviewOperatorCase(id);
      await loadCases();
    } catch (error) {
      setSafetyError(error.message);
    }
  }
  async function removeImage(id) {
    try {
      await excludeMedia(id, removalReasons[id]?.trim());
      await loadCases();
    } catch (error) { setSafetyError(error.message); }
  }
  async function loadDisputes() {
    try {
      setSafetyError('');
      const rows = await getOutcomeDisputes();
      setDisputes(rows);
      const evidence = await Promise.all(rows.map(async item => [item.id, await getCaseEvidence(item.id)]));
      setCaseEvidence(Object.fromEntries(evidence));
    } catch (error) {
      setDisputes(null);
      setSafetyError(error.message);
    }
  }
  async function reviewDispute(id) {
    try {
      await reviewOutcomeDispute(id, reviewNotes[id]?.trim());
      await loadDisputes();
    } catch (error) {
      setSafetyError(error.message);
    }
  }
  return (
    <>
      <Header title="Your Profile" />
      <div className="profile-card">
        <div className="avatar large">{(profile?.name || 'C').charAt(0)}</div>
        <h1>{profile?.name || 'Your profile'}</h1>
        <p>{profile?.neighborhood || 'Neighborhood not set'}</p>
        <p>{profile?.bio || 'Add a little about yourself.'}</p>
        <button
          className="secondary"
          onClick={() => (profile ? setModal(true) : navigate('register'))}
        >
          {profile ? 'Edit profile' : 'Create profile'}
        </button>
      </div>
      <section>
        <h2>Connection</h2>
        <p className="muted">
          {signedIn ? 'Logged in to Connecto' : 'Local profile — log in to use the API'}
        </p>
        {signedIn && (
          <button className="secondary" onClick={onLogout}>
            Log out
          </button>
        )}
        <button className="secondary" onClick={() => navigate('login')}>
          Open login screen
        </button>
        {!signedIn && (
          <label className="checkbox">
            <input
              type="checkbox"
              checked={apiMode}
              onChange={(e) => setApiMode(e.target.checked)}
            />
            Use Connecto API for new posts
          </label>
        )}
        <p className="muted">
          {apiMode
            ? 'Needs and Offerings are saved to the backend. Matches use server scores and explanations.'
            : 'Demo mode: posts and matches stay on this device.'}
        </p>
        <p className="muted">
          {signedIn
            ? 'Profile, activity, discovery, agreements, conversations and independent outcomes use the API. Other journey steps are still being implemented.'
            : 'Preview data lasts for this session. Log in to save your profile and activity.'}
        </p>
      </section>
      {signedIn && (
        <section className="safety-panel">
          <h2>Safety activity</h2>
          <p className="muted">
            Your reports are private. Reviewed means an operator has recorded a review,
            not that a particular action was taken.
          </p>
          {reports.length === 0 && <p>No reports submitted.</p>}
          {reports.map((report) => (
            <p key={report.id}>
              {report.reason} · {report.status} ·{' '}
              {new Date(report.createdAt).toLocaleDateString()}
            </p>
          ))}
          <h3>Blocked members</h3>
          {blocked.length === 0 && <p>No members blocked.</p>}
          {blocked.map((id) => (
            <p key={id}>
              Member {id.slice(0, 8)}{' '}
              <button className="secondary" type="button" onClick={() => unblock(id)}>
                Unblock
              </button>
            </p>
          ))}
          {safetyError && <p role="alert">{safetyError}</p>}
        </section>
      )}
      {signedIn && (
        <section>
          <h2>Pilot measurement</h2>
          <p className="muted">Available to configured pilot viewers and safety operators. The window groups connection requests by creation time in UTC. Counts come from saved API records.</p>
          <label htmlFor="pilot-from">From (inclusive)</label>
          <input id="pilot-from" type="date" value={pilotWindow.from}
            onChange={event => setPilotWindow(value => ({ ...value, from: event.target.value }))} />
          <label htmlFor="pilot-to">To (exclusive)</label>
          <input id="pilot-to" type="date" value={pilotWindow.to}
            onChange={event => setPilotWindow(value => ({ ...value, to: event.target.value }))} />
          <button className="secondary" type="button" onClick={loadPilotMetrics}>Load cohort report</button>
          {pilotMetrics && <div role="region" aria-label="Pilot cohort report">
            <p>Discovery coverage: {pilotMetrics.discovery.coveredNeeds} / {pilotMetrics.discovery.searchedNeeds} searched Needs. Marked suitable: {pilotMetrics.suitability.markedNeeds} / {pilotMetrics.suitability.coveredNeeds} covered Needs ({pilotMetrics.suitability.markedNeedOfferingPairs} Need–Offering pairs).</p>
            <p>Requests: {pilotMetrics.cohort.requestCount}. Accepted: {pilotMetrics.acceptance.numerator} / {pilotMetrics.acceptance.denominator}.</p>
            <p>Request states: pending {pilotMetrics.requestStates.pending}; declined {pilotMetrics.requestStates.declined}; withdrawn {pilotMetrics.requestStates.withdrawn}; accepted {pilotMetrics.requestStates.accepted}.</p>
            <p>Both confirmed: {pilotMetrics.completion.numerator} / {pilotMetrics.completion.denominator} accepted. One reported: {pilotMetrics.completion.oneReported}; cancelled: {pilotMetrics.completion.cancelled}; disputed: {pilotMetrics.completion.disputed}.</p>
            <p>Feedback submissions: {pilotMetrics.feedback.submittedParticipantSlots} / {pilotMetrics.feedback.eligibleParticipantSlots} eligible participant slots. Bilateral published: {pilotMetrics.feedback.bilateralPublishedAgreements} / {pilotMetrics.feedback.eligibleAgreements} eligible agreements.</p>
            <p>Published rating mean: {pilotMetrics.feedback.publishedRatingMean?.toFixed(2) ?? 'unavailable'} ({pilotMetrics.feedback.publishedRatingCount} dimension ratings). Median time to connect: {pilotMetrics.timeToConnect.median?.toFixed(1) ?? 'unavailable'} hours ({pilotMetrics.timeToConnect.count} agreements).</p>
            <p>Requester ratings: {pilotMetrics.feedback.requesterRatingMean?.toFixed(2) ?? 'unavailable'} ({pilotMetrics.feedback.requesterRatingCount} dimensions). Provider ratings: {pilotMetrics.feedback.providerRatingMean?.toFixed(2) ?? 'unavailable'} ({pilotMetrics.feedback.providerRatingCount} dimensions).</p>
            <p>Repeat participants: {pilotMetrics.repeatUse.numerator} / {pilotMetrics.repeatUse.denominator} participants in accepted agreements.</p>
            <p className="muted">Not yet measured: {pilotMetrics.unavailable.join('; ')}.</p>
          </div>}
        </section>
      )}
      {signedIn && (
        <section>
          <h2>Operator cases</h2>
          <p className="muted">
            Available to configured safety operators. Review records that a case was seen;
            decisions and escalation remain part of the human process.
          </p>
          <button className="secondary" type="button" onClick={loadCases}>
            Open operator queue
          </button>
          {cases?.length === 0 && <p>No open cases.</p>}
          {cases?.map((item) => (
            <article key={item.id} className="safety-panel">
              <b>{item.reason}</b>
              <p>{item.details}</p>
              <small>
                Case {item.id} · subject {item.subjectId}
              </small>
              {item.mediaAssetId && <>
                <MediaAttachments assets={[{ id: item.mediaAssetId, stage: 'ready', kind: 'reported image' }]}
                  getMediaContent={getMediaContent} />
                <label htmlFor={`media-removal-${item.id}`}>Image removal reason</label>
                <textarea id={`media-removal-${item.id}`} maxLength={1000}
                  value={removalReasons[item.mediaAssetId] || ''}
                  onChange={event => setRemovalReasons(value => ({ ...value, [item.mediaAssetId]: event.target.value }))} />
                <button type="button" className="secondary" disabled={!removalReasons[item.mediaAssetId]?.trim()}
                  onClick={() => removeImage(item.mediaAssetId)}>Remove reported image</button>
              </>}
              <button className="secondary" type="button" onClick={() => review(item.id)}>
                Mark reviewed
              </button>
            </article>
          ))}
          <h3>Outcome disputes</h3>
          <p className="muted">Review records acknowledgement; it does not decide the outcome or payment liability.</p>
          <button className="secondary" type="button" onClick={loadDisputes}>Open dispute queue</button>
          {disputes?.length === 0 && <p>No unreviewed disputes.</p>}
          {disputes?.map((item) => <article key={item.id} className="safety-panel">
            <p>Agreement {item.id}</p>
            <p>Requester {item.requesterId} · Provider {item.providerId}</p>
            <h4>Private case evidence</h4>
            <MediaAttachments assets={caseEvidence[item.id] || []} getMediaContent={getMediaContent} />
            <label htmlFor={`review-${item.id}`}>Private review note</label>
            <textarea id={`review-${item.id}`} maxLength={1000} value={reviewNotes[item.id] || ''}
              onChange={event => setReviewNotes(current => ({ ...current, [item.id]: event.target.value }))} />
            <button type="button" className="secondary" disabled={!reviewNotes[item.id]?.trim()}
              onClick={() => reviewDispute(item.id)}>Record review</button>
          </article>)}
        </section>
      )}
      <section>
        <h2>Your Scheduled Gigs</h2>
        <Empty text="Your coordinated work will appear here. Start by posting a Need or offering a skill." />
      </section>
      <button className="primary" onClick={() => navigate('gigs')}>
        View your activity
      </button>
    </>
  );
}

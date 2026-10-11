import { useCallback, useEffect, useState } from 'react';
import MediaAttachments from './MediaAttachments.jsx';

const requesterFields = [
  ['reliability', 'Provider reliability'],
  ['communication', 'Communication'],
  ['agreement', 'Meeting the agreement'],
];
const providerFields = [
  ['communication', 'Communication'],
  ['clarity', 'Clarity of expectations'],
  ['commitments', 'Honouring commitments'],
];

export default function ReviewPanel({ agreement, profileId, getReviewEligibility,
  getAgreementReviews, submitReview, withdrawReview, getReputation,
  uploadMedia, getAgreementMedia, getMediaContent, withdrawMedia, reportMedia }) {
  const [eligibility, setEligibility] = useState(null);
  const [reviews, setReviews] = useState(null);
  const [reputation, setReputation] = useState(null);
  const [ratings, setRatings] = useState({});
  const [comment, setComment] = useState('');
  const [delay, setDelay] = useState(14);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [media, setMedia] = useState([]);
  const [file, setFile] = useState(null);
  const [kind, setKind] = useState('outcome');
  const [reportingId, setReportingId] = useState(null);
  const [reportReason, setReportReason] = useState('inappropriate');
  const [reportDetails, setReportDetails] = useState('');
  const reviewee = profileId === agreement.requesterId ? agreement.providerId : agreement.requesterId;
  const refresh = useCallback(async () => {
    setError('');
    try {
      const [nextEligibility, nextReviews, nextReputation, nextMedia] = await Promise.all([
        getReviewEligibility(agreement.id), getAgreementReviews(agreement.id), getReputation(reviewee),
        getAgreementMedia(agreement.id),
      ]);
      setEligibility(nextEligibility);
      setReviews(nextReviews);
      setReputation(nextReputation);
      setMedia(nextMedia);
    } catch (failure) { setError(failure.message); }
  }, [agreement.id, reviewee, getReviewEligibility, getAgreementReviews, getReputation, getAgreementMedia]);
  useEffect(() => { refresh(); }, [refresh]);

  async function act(action) {
    setBusy(true);
    setError('');
    try {
      if (action === 'submit') await submitReview(agreement.id, {
        reliability: ratings.reliability || null, communication: ratings.communication || null,
        agreement: ratings.agreement || null, clarity: ratings.clarity || null,
        commitments: ratings.commitments || null, comment: comment.trim() || null,
        publicationDelayDays: Number(delay),
        assetIds: media.filter(item => item.purpose === 'review' && !item.reviewId && item.stage === 'ready').map(item => item.id),
      });
      else await withdrawReview(agreement.id);
      await refresh();
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function upload() {
    if (!file) return;
    setBusy(true); setError('');
    try { await uploadMedia(agreement.id, 'review', kind, file); setFile(null); await refresh(); }
    catch (failure) { setError(`${failure.message} You can still submit a text review.`); await refresh(); }
    finally { setBusy(false); }
  }
  async function remove(id) {
    setBusy(true); setError('');
    try { await withdrawMedia(id); await refresh(); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }
  async function report() {
    setBusy(true); setError('');
    try { await reportMedia(reportingId, { reason: reportReason, details: reportDetails.trim() });
      setReportingId(null); setReportDetails(''); }
    catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  const fields = eligibility?.role === 'requester' ? requesterFields : providerFields;
  const summary = reputation && (eligibility?.role === 'requester' ? reputation.asProvider : reputation.asRequester);
  const historyRole = eligibility?.role;
  return <section aria-label="Agreement reviews">
    <h4>Reciprocal reviews</h4>
    <p className="muted">Only both-confirmed work is eligible. Your review stays hidden until both submit or your chosen deadline passes. Missing feedback is never a negative rating.</p>
    <button type="button" className="secondary" onClick={refresh}>Refresh reviews</button>
    {error && <p role="alert">{error}</p>}
    {!eligibility ? <p role="status">Loading review eligibility…</p> : <>
      <p>Your review: {eligibility.ownStatus.replaceAll('_', ' ')}</p>
      {eligibility.windowClosesAt && <p>Submit by {new Date(eligibility.windowClosesAt).toLocaleString()}</p>}
      {eligibility.eligible && <>
        <h5>Optional outcome photos</h5>
        <p className="muted">Add up to three before, after or outcome photos. The image must finish private processing before submission. A failed photo does not prevent text feedback.</p>
        <label htmlFor={`photo-kind-${agreement.id}`}>Photo type</label>
        <select id={`photo-kind-${agreement.id}`} value={kind} onChange={event => setKind(event.target.value)}>
          <option value="before">Before</option><option value="after">After</option><option value="outcome">Outcome</option>
        </select>
        <label htmlFor={`photo-file-${agreement.id}`}>Image file</label>
        <input id={`photo-file-${agreement.id}`} type="file" accept="image/jpeg,image/png,image/webp"
          onChange={event => setFile(event.target.files?.[0] || null)} />
        <button type="button" className="secondary" disabled={busy || !file} onClick={upload}>Upload private photo</button>
        <MediaAttachments assets={media.filter(item => item.purpose === 'review' && !item.reviewId)}
          getMediaContent={getMediaContent} onWithdraw={remove} busy={busy} />
        {fields.map(([key, label]) => <label key={key} htmlFor={`review-${agreement.id}-${key}`}>
          {label} (optional)
          <select id={`review-${agreement.id}-${key}`} value={ratings[key] || ''}
            onChange={event => setRatings(value => ({ ...value, [key]: Number(event.target.value) || null }))}>
            <option value="">Unanswered</option>
            {[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>)}
        <label htmlFor={`review-${agreement.id}-comment`}>Comment (optional)</label>
        <textarea id={`review-${agreement.id}-comment`} maxLength={2000} value={comment}
          onChange={event => setComment(event.target.value)} />
        <label htmlFor={`review-${agreement.id}-delay`}>Publish my review after this many days if the other person does not submit</label>
        <input id={`review-${agreement.id}-delay`} type="number" min={eligibility.minimumDelayDays}
          max={eligibility.maximumDelayDays} value={delay} onChange={event => setDelay(event.target.value)} />
        <button type="button" disabled={busy || !fields.some(([key]) => ratings[key]) ||
          delay < eligibility.minimumDelayDays || delay > eligibility.maximumDelayDays}
          onClick={() => act('submit')}>Submit hidden review</button>
      </>}
      {reviews?.own && <>
        <p>Your submitted review: {reviews.own.comment || 'No comment'}</p>
        <p>Chosen deadline: {new Date(reviews.own.publishAfterAt).toLocaleString()}</p>
        {!reviews.own.withdrawnAt && <button type="button" className="secondary" disabled={busy}
          onClick={() => act('withdraw')}>Withdraw my review</button>}
        <MediaAttachments assets={media.filter(item => item.reviewId === reviews.own.id)}
          getMediaContent={getMediaContent} onWithdraw={remove} busy={busy} />
      </>}
      {reviews?.reciprocal ? <p>Other participant’s published review: {reviews.reciprocal.comment || 'No comment'}.</p>
        : <p>The other participant’s review is unavailable or still hidden.</p>}
      {reviews?.reciprocal && <MediaAttachments assets={media.filter(item => item.reviewId === reviews.reciprocal.id)}
        getMediaContent={getMediaContent} onReport={setReportingId} busy={busy} />}
      {reportingId && <section aria-label="Report photo">
        <h5>Report photo</h5>
        <label htmlFor={`photo-report-reason-${agreement.id}`}>Reason</label>
        <select id={`photo-report-reason-${agreement.id}`} value={reportReason}
          onChange={event => setReportReason(event.target.value)}>
          <option value="inappropriate">Inappropriate content</option>
          <option value="personal_information">Personal information</option>
          <option value="misleading">Misleading evidence</option>
          <option value="abuse">Abuse</option>
        </select>
        <label htmlFor={`photo-report-details-${agreement.id}`}>Details</label>
        <textarea id={`photo-report-details-${agreement.id}`} maxLength={2000} value={reportDetails}
          onChange={event => setReportDetails(event.target.value)} />
        <button type="button" disabled={busy || !reportDetails.trim()} onClick={report}>Submit report</button>
        <button type="button" className="secondary" onClick={() => setReportingId(null)}>Cancel</button>
      </section>}
      {summary && <p>Published reviews of the other participant in this role: {summary.reviewCount}.
        {summary.insufficientHistory && ' Insufficient history.'}</p>}
      {summary && !summary.insufficientHistory && <>
        <h5>Dimension averages</h5>
        <ul>{Object.entries(summary.dimensions).map(([key, value]) => <li key={key}>
          {key.replaceAll('_', ' ')}: {value.average == null ? 'No answers' : `${value.average} / 5`} ({value.count})
        </li>)}</ul>
        <h5>Recent published reviews</h5>
        <ol>{reputation.history.filter(item => item.reviewerRole === historyRole).map(item => <li key={item.id}>
          {new Date(item.submittedAt).toLocaleDateString()} · {item.comment || 'Ratings only'}
          <MediaAttachments assets={(item.photoIds || []).map(id => ({ id, stage: 'ready', kind: 'review photo' }))}
            getMediaContent={getMediaContent} onReport={setReportingId} busy={busy} />
        </li>)}</ol>
      </>}
    </>}
  </section>;
}

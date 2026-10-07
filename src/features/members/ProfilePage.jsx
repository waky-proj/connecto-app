import Header from '../../shared/ui/Header.jsx';
import Empty from '../../shared/ui/Empty.jsx';
import { useEffect, useState } from 'react';
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
  reviewOperatorCase,
}) {
  const [blocked, setBlocked] = useState([]);
  const [reports, setReports] = useState([]);
  const [safetyError, setSafetyError] = useState('');
  const [cases, setCases] = useState(null);
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
  async function review(id) {
    try {
      await reviewOperatorCase(id);
      await loadCases();
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
            ? 'Profile, activity, discovery, agreements and accepted-agreement conversations use the API. Other journey steps are still being implemented.'
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
              <button className="secondary" type="button" onClick={() => review(item.id)}>
                Mark reviewed
              </button>
            </article>
          ))}
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

import Header from '../../shared/ui/Header.jsx';
import Empty from '../../shared/ui/Empty.jsx';
export default function ProfilePage({
  profile,
  signedIn,
  onLogout,
  setModal,
  apiMode,
  setApiMode,
  navigate,
}) {
  return (
    <>
      <Header title="Your Profile" />
      <div className="profile-card">
        <div className="avatar large">{(profile?.name || 'C').charAt(0)}</div>
        <h1>{profile?.name || 'Clara Miller'}</h1>
        <p>{profile?.neighborhood || 'Sunset Valley'} · Community neighbor</p>
        <p>{profile?.bio || 'A friendly face in the neighborhood.'}</p>
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
            ? 'Profile edits and your activity use the API. Marketplace discovery and conversations are still being implemented.'
            : 'Preview data lasts for this session. Log in to save your profile and activity.'}
        </p>
      </section>
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

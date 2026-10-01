import { User, X } from 'lucide-react';
export default function ProfileDialog({
  profile,
  saveProfile,
  busy,
  signedIn,
  setModal,
}) {
  return (
    <div className="modal-backdrop">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
      >
        <div className="section-heading">
          <h2 id="profile-title">Your neighborhood profile</h2>
          <button aria-label="Close profile" onClick={() => setModal(false)}>
            <X />
          </button>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = Object.fromEntries(new FormData(e.currentTarget));
            saveProfile(data);
          }}
        >
          <label>
            Your name
            <input
              autoFocus
              name="name"
              required
              maxLength={60}
              defaultValue={profile?.name || ''}
              placeholder="Clara Miller"
            />
          </label>
          <label>
            Neighborhood
            <input
              name="neighborhood"
              required
              maxLength={60}
              defaultValue={profile?.neighborhood || 'Sunset Valley'}
            />
          </label>
          <p className="muted">
            {signedIn
              ? 'Profile edits are saved to your Connecto account.'
              : 'Preview edits last for this session.'}
          </p>
          <label>
            A little about you
            <textarea name="bio" maxLength={300} defaultValue={profile?.bio || ''} />
          </label>
          <button className="primary" disabled={busy}>
            Save Profile
          </button>
        </form>
      </div>
    </div>
  );
}

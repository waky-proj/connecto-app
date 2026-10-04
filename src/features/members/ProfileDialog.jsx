import { X } from 'lucide-react';
export default function ProfileDialog({
  profile,
  saveProfile,
  busy,
  signedIn,
  setModal,
  error,
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
          <fieldset disabled={busy} className="auth-fields">
            {signedIn ? (
              <>
                <label>
                  First name
                  <input
                    autoFocus
                    name="firstName"
                    autoComplete="given-name"
                    required
                    maxLength={200}
                    defaultValue={profile?.firstName || ''}
                  />
                </label>
                <label>
                  Last name
                  <input
                    name="lastName"
                    autoComplete="family-name"
                    maxLength={200}
                    defaultValue={profile?.lastName || ''}
                  />
                </label>
              </>
            ) : (
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
            )}
            <label>
              Neighborhood
              <input
                name="neighborhood"
                required
                maxLength={signedIn ? 200 : 60}
                defaultValue={profile?.neighborhood || ''}
              />
            </label>
            <p className="muted">
              {signedIn
                ? 'Profile edits are saved to your Connecto account.'
                : 'Preview edits last for this session.'}
            </p>
            <label>
              A little about you
              <textarea
                name="bio"
                maxLength={signedIn ? 2000 : 300}
                defaultValue={profile?.bio || ''}
              />
            </label>
            {error && (
              <div className="api-error" role="alert">
                {error}
              </div>
            )}
            <button className="primary" disabled={busy}>
              {busy ? 'Saving profile…' : 'Save Profile'}
            </button>
          </fieldset>
        </form>
      </div>
    </div>
  );
}

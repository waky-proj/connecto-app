import { X } from 'lucide-react';
import AppRouter from './AppRouter.jsx';
import WelcomePage from './WelcomePage.jsx';
import { ProfileDialog } from '../features/members/index.js';
import Sidebar from './layout/Sidebar.jsx';
import CommunityNote from './layout/CommunityNote.jsx';
import BottomNavigation from './layout/BottomNavigation.jsx';
export default function AppShell({ model }) {
  const {
    page,
    navigate,
    busy,
    apiError,
    profileError,
    profileBusy,
    notice,
    activeNeed,
    showMatches,
    setNotice,
    navVisible,
    modal,
    profile,
    saveProfile,
    signedIn,
    setModal,
  } = model;
  return (
    <div className="workspace">
      <Sidebar page={page} navigate={navigate} />
      <main className={`phone ${page === 'welcome' ? 'welcome' : ''}`}>
        {busy && (
          <p className="muted" role="status">
            Connecting to Connecto API…
          </p>
        )}
        {apiError && (
          <div className="api-error" role="alert">
            {apiError}
            {page === 'matches' && (
              <button
                className="secondary"
                disabled={busy}
                onClick={() => showMatches(activeNeed)}
              >
                Retry matches
              </button>
            )}
          </div>
        )}
        {notice && (
          <div className="toast" role="status">
            {notice}
            <button aria-label="Dismiss notification" onClick={() => setNotice('')}>
              <X size={16} />
            </button>
          </div>
        )}
        {page === 'welcome' ? (
          <WelcomePage navigate={navigate} />
        ) : (
          <AppRouter model={model} />
        )}
        {navVisible && <BottomNavigation page={page} navigate={navigate} />}
        {modal && (
          <ProfileDialog
            profile={profile}
            saveProfile={saveProfile}
            busy={profileBusy}
            signedIn={signedIn}
            error={profileError}

            setModal={setModal}
          />
        )}
      </main>
      <CommunityNote />
    </div>
  );
}

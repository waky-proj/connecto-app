import { AuthScreen } from '../features/auth/index.js';
import { ProfilePage } from '../features/members/index.js';
import { NeedForm, OfferForm, OfferingDetailPage } from '../features/listings/index.js';
import { DiscoverPage, MatchesPage } from '../features/discovery/index.js';
import { ActivityPage } from '../features/activity/index.js';
import { InboxPage, ChatPage } from '../features/conversations/index.js';
export default function AppRouter({ model }) {
  const {
    profile,
    signedIn,
    login,
    register,
    confirm,
    resend,
    logout,
    previewProfile,
    refreshActivity,
    offers,
    needs,
    messages,
    setMessages,
    page,
    category,
    setCategory,
    query,
    setQuery,
    selected,
    setSelected,
    activeNeed,
    setModal,
    filterToday,
    setFilterToday,
    busy,
    apiError,
    apiMode,
    setApiMode,
    publishNeed,
    publishOffering,
    changeListingLifecycle,
    editListing,
    saveListing,
    navigate,
    openOffer,
    showMatches,
    results,
    filtered,
  } = model;

  switch (page) {
    case 'welcome':
      return null;
    case 'register':
    case 'login':
      return (
        <AuthScreen
          key={page}
          mode={page}
          profile={profile}
          onBack={() => navigate('welcome')}
          onSwitch={navigate}
          onPreview={previewProfile}
          onLogin={login}
          onRegister={register}
          onConfirm={confirm}
          onResend={resend}
        />
      );
    case 'discover':
      return (
        <DiscoverPage
          profile={profile}
          offers={offers}
          needs={needs}
          setCategory={setCategory}
          query={query}
          setQuery={setQuery}
          navigate={navigate}
          openOffer={openOffer}

          filtered={filtered}
        />
      );
    case 'helpers':
    case 'matches':
      return (
        <MatchesPage
          page={page}
          category={category}
          query={query}
          setQuery={setQuery}

          activeNeed={activeNeed}
          filterToday={filterToday}
          setFilterToday={setFilterToday}
          busy={busy}
          apiError={apiError}
          navigate={navigate}
          openOffer={openOffer}
          results={results}
          filtered={filtered}
        />
      );
    case 'detail':
      if (!selected) return null;
      return (
        <OfferingDetailPage
          selected={selected}
          activeNeed={activeNeed}
          navigate={navigate}
        />
      );
    case 'need':
      return (
        <NeedForm
          onBack={() => navigate('discover')}
          busy={busy}
          apiMode={apiMode}
          onSubmit={publishNeed}
        />
      );
    case 'need-edit':
      if (!selected?.listing) return null;
      return <NeedForm key={selected.listing.id} initial={selected.listing} onBack={() => navigate('gigs')} busy={busy} apiMode={apiMode} onSubmit={(values) => saveListing('need', values, selected.listing)} />;
    case 'offer':
      return (
        <OfferForm
          onBack={() => navigate('discover')}
          busy={busy}
          apiMode={apiMode}
          onSubmit={publishOffering}
        />
      );
    case 'offer-edit':
      if (!selected?.listing) return null;
      return <OfferForm key={selected.listing.id} initial={selected.listing} onBack={() => navigate('gigs')} busy={busy} apiMode={apiMode} onSubmit={(values) => saveListing('offering', values, selected.listing)} />;
    case 'profile':
      return (
        <ProfilePage
          signedIn={signedIn}
          onLogout={logout}
          profile={profile}
          setModal={setModal}
          apiMode={apiMode}
          setApiMode={setApiMode}
          navigate={navigate}
        />
      );
    case 'gigs':
      return (
        <ActivityPage
          onRefresh={signedIn ? refreshActivity : null}
          busy={busy}
          offers={offers}
          needs={needs}

          navigate={navigate}
          openOffer={openOffer}
          showMatches={showMatches}
          onLifecycle={changeListingLifecycle}
          onEdit={editListing}
          apiMode={apiMode}
        />
      );
    case 'inbox':
      return (
        <InboxPage
          offers={offers}
          messages={messages}
          setSelected={setSelected}
          navigate={navigate}
        />
      );
    case 'chat':
      if (!selected) return null;
      return (
        <ChatPage
          messages={messages}
          setMessages={setMessages}
          selected={selected}
          navigate={navigate}
        />
      );
    default:
      return null;
  }
}

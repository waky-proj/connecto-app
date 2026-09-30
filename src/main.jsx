import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Users,
  Search,
  Briefcase,
  Home,
  Leaf,
  Cpu,
  BookOpen,
  Compass,
  ClipboardList,
  MessageSquare,
  User,
  ArrowLeft,
  MapPin,
  Star,
  SlidersHorizontal,
  Plus,
  Check,
  Send,
  X,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { categories, initialOfferings, rankMatches } from './matching';
import './styles.css';
import {
  createApiClient,
  needPayload,
  offeringPayload,
  normalizeMatches,
  apiSkills,
} from './api';
const api = createApiClient({
  baseUrl: import.meta.env.VITE_CONNECTO_API_BASE_URL || '',
});

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
function useSaved(key, fallback) {
  const [value, setValue] = useState(() => read(key, fallback));
  return [
    value,
    (next) => {
      setValue(next);
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* Continue with in-memory state when storage is unavailable. */
      }
    },
  ];
}
const icons = { Garden: Leaf, 'Home Help': Home, 'Tech Guru': Cpu, Lessons: BookOpen };
function App() {
  const [profile, setProfile] = useSaved('connecto-profile', null),
    [offers, setOffers] = useSaved('connecto-offers', initialOfferings),
    [needs, setNeeds] = useSaved('connecto-needs', []),
    [messages, setMessages] = useSaved('connecto-messages', {});
  const [page, setPage] = useState(profile ? 'discover' : 'welcome'),
    [category, setCategory] = useState('Garden'),
    [query, setQuery] = useState(''),
    [selected, setSelected] = useState(initialOfferings[0]),
    [activeNeed, setActiveNeed] = useState(null),
    [modal, setModal] = useState(false),
    [notice, setNotice] = useState(''),
    [filterToday, setFilterToday] = useState(false);
  const [apiMatches, setApiMatches] = useState([]);
  const [busy, setBusy] = useState(false);
  const [apiError, setApiError] = useState('');
  const [apiMode, setApiMode] = useSaved('connecto-api-mode', true);
  const apiUserId = profile?.apiUserId || import.meta.env.VITE_CONNECTO_USER_ID || '';
  async function publishNeed(n) {
    setBusy(true);
    setApiError('');
    try {
      const response = apiMode
        ? await api.createNeed(
            apiUserId,
            needPayload(n, profile?.neighborhood || 'Sunset Valley'),
          )
        : { id: crypto.randomUUID() };
      if (!response?.id) throw new Error('The API did not return a Need ID.');
      const next = {
        ...n,
        ...response,
        source: apiMode ? 'api' : 'demo',
        createdAt: new Date().toISOString(),
      };
      setNeeds([...needs, next]);
      await showMatches(next);
      setNotice(
        apiMode
          ? 'Your request was saved to Connecto API.'
          : 'Demo request saved on this device.',
      );
    } catch (error) {
      setApiError(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function publishOffering(o) {
    setBusy(true);
    setApiError('');
    try {
      const response = apiMode
        ? await api.createOffering(
            apiUserId,
            offeringPayload(o, profile?.neighborhood || 'Sunset Valley'),
          )
        : { id: crypto.randomUUID() };
      if (!response?.id) throw new Error('The API did not return an Offering ID.');
      setOffers([
        ...offers,
        {
          ...o,
          ...response,
          source: apiMode ? 'api' : 'demo',
          name: profile?.name || 'You',
          distance: 0,
          rating: 0,
          reviews: 0,
          emoji: '🤝',
        },
      ]);
      navigate('gigs');
      setNotice(
        apiMode
          ? 'Your offering was saved to Connecto API.'
          : 'Demo offering saved on this device.',
      );
    } catch (error) {
      setApiError(error.message);
    } finally {
      setBusy(false);
    }
  }
  const navigate = (p) => {
    setPage(p);
    setNotice('');
    setApiError('');
  };
  const openOffer = (o) => {
    setSelected(o);
    navigate('detail');
  };
  async function showMatches(n) {
    setActiveNeed(n);
    setCategory(n.category);
    setApiMatches([]);
    navigate('matches');
    if (n.source !== 'api') return;
    setBusy(true);
    try {
      setApiMatches(normalizeMatches(await api.getMatches(n.id), offers, n));
    } catch (error) {
      setApiError(error.message);
    } finally {
      setBusy(false);
    }
  }
  const results =
    activeNeed?.source === 'api'
      ? apiMatches
      : activeNeed
        ? rankMatches(
            activeNeed,
            offers.filter((o) => o.source !== 'api'),
          )
        : [];
  const filtered = offers.filter(
    (o) =>
      (page !== 'helpers' || o.category === category) &&
      (!filterToday || o.availability === 'Today') &&
      `${o.title} ${o.name} ${o.category}`.toLowerCase().includes(query.toLowerCase()),
  );
  const navVisible = !['welcome', 'need', 'offer', 'detail'].includes(page);
  return (
    <div className="workspace">
      <aside className="desktop-side">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate('discover');
          }}
        >
          <span>
            <Users size={23} />
          </span>
          Connecto
        </a>
        <p>
          Your neighborhood.
          <br />A little more connected.
        </p>
        <nav>
          {[
            ['discover', Compass, 'Discover'],
            ['gigs', ClipboardList, 'My activity'],
            ['inbox', MessageSquare, 'Inbox'],
            ['profile', User, 'My profile'],
          ].map(([p, I, label]) => (
            <button
              className={page === p ? 'active' : ''}
              key={p}
              onClick={() => navigate(p)}
            >
              <I size={19} />
              {label}
            </button>
          ))}
        </nav>
        <div className="side-bottom">
          <span className="status-dot" /> Sunset Valley{' '}
          <p>A helping hand is closer than you think.</p>
        </div>
      </aside>
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
          <>
            <div className="brand">
              <span>
                <Users size={22} />
              </span>
              Connecto
            </div>
            <div className="welcome-copy">
              <h1>
                Help is always
                <br />
                around the corner.
              </h1>
              <p>
                Your trusted neighborhood hub for finding local skills, hands-on help, and
                community resources.
              </p>
              <small>CHOOSE YOUR PATH</small>
              <button className="path primary-path" onClick={() => navigate('discover')}>
                <span>
                  <Search />
                </span>
                <div>
                  <b>I need help with something</b>
                  <p>
                    Find trusted neighbors for tasks,
                    <br />
                    gardening, tutoring & help.
                  </p>
                </div>
              </button>
              <button className="path" onClick={() => navigate('offer')}>
                <span className="green">
                  <Briefcase />
                </span>
                <div>
                  <b>I want to offer my help</b>
                  <p>Share your skills, lease tools, or offer your local services.</p>
                </div>
              </button>
            </div>
            <div className="welcome-footer">
              <button className="primary" onClick={() => setModal(true)}>
                Create Your Profile
              </button>
              <p>
                Already have a local profile?{' '}
                <button className="text-button" onClick={() => setModal(true)}>
                  Sign In
                </button>
              </p>
              <small>This POC saves your profile on this device.</small>
            </div>
          </>
        ) : (
          <>
            {page === 'discover' ? (
              <>
                <header className="home-header">
                  <div className="avatar">
                    {(profile?.name || 'Clara Miller').slice(0, 1)}
                  </div>
                  <div>
                    <small>Welcome back,</small>
                    <b>{profile?.name || 'Clara Miller'}</b>
                  </div>
                  <span className="location">
                    <MapPin size={12} />
                    {profile?.neighborhood || 'Sunset Valley'}
                  </span>
                </header>
                <SearchBox query={query} setQuery={setQuery} />
                <section>
                  <h2>Explore Categories</h2>
                  <div className="categories">
                    {categories.map((c) => {
                      const I = icons[c];
                      return (
                        <button
                          key={c}
                          onClick={() => {
                            setCategory(c);
                            setQuery('');
                            navigate('helpers');
                          }}
                        >
                          <span>
                            <I size={22} />
                          </span>
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </section>
                <section>
                  <div className="section-heading">
                    <h2>{query ? 'Search results' : 'Highly Rated Nearby'}</h2>
                    <button
                      className="text-button"
                      onClick={() => {
                        setCategory('Garden');
                        navigate('helpers');
                      }}
                    >
                      View all
                    </button>
                  </div>
                  {(query
                    ? filtered
                    : [offers[0], offers.find((o) => o.id === 'elena')].filter(Boolean)
                  ).map((o) => (
                    <OfferCard key={o.id} offer={o} onClick={() => openOffer(o)} />
                  ))}
                  {query && !filtered.length && (
                    <Empty text="No neighbors found. Try another skill or name." />
                  )}
                </section>
                <section>
                  <h2>Active Help Requests Nearby</h2>
                  <div className="neighborhood-map">
                    <span>🌳</span>
                    <span>🏡</span>
                    <span>🌳</span>
                    <span>🏠</span>
                    <span>🏡</span>
                    <span>🏠</span>
                    <MapPin className="pin p1" />
                    <MapPin className="pin p2" />
                    <MapPin className="pin p3" />
                    <div className="map-label">
                      <i />
                      {needs.length + 12} requests near you
                    </div>
                  </div>
                  <p className="muted">Illustrative neighborhood map · Sunset Valley</p>
                </section>
                <div className="action-row">
                  <button className="primary" onClick={() => navigate('need')}>
                    <Plus size={16} />
                    Request help
                  </button>
                  <button className="secondary" onClick={() => navigate('offer')}>
                    Offer your skills
                  </button>
                </div>
              </>
            ) : page === 'helpers' || page === 'matches' ? (
              <>
                <Header
                  title={
                    page === 'matches'
                      ? 'Your ranked matches'
                      : `${category === 'Garden' ? 'Garden' : category} Helpers`
                  }
                  back={() => navigate('discover')}
                  right={
                    <button
                      aria-label="Toggle available today filter"
                      className={filterToday ? 'selected-filter' : ''}
                      onClick={() => setFilterToday(!filterToday)}
                    >
                      <SlidersHorizontal size={19} />
                    </button>
                  }
                />
                {page === 'matches' ? (
                  <div className="need-summary">
                    <small>MATCHING FOR</small>
                    <h2>{activeNeed?.title}</h2>
                    <p>
                      {activeNeed?.timeframe} · ${activeNeed?.budget} budget ·{' '}
                      {activeNeed?.hours} hour(s)
                    </p>
                    <small>
                      {activeNeed?.source === 'api'
                        ? 'Backend scores use skills, requirements, availability, budget, location, experience, and reputation.'
                        : 'Demo scores use category, budget, availability, distance, tools, and rating.'}
                    </small>
                  </div>
                ) : (
                  <>
                    <SearchBox query={query} setQuery={setQuery} />
                    <div className="chips">
                      <span>{category}</span>
                      <button onClick={() => setFilterToday(!filterToday)}>
                        {filterToday ? '✓ ' : ''}Available Today
                      </button>
                    </div>
                  </>
                )}
                <p className="muted">
                  {page === 'matches' ? results.length : filtered.length} neighbors
                  offering relevant skills
                </p>
                {(page === 'matches' ? results : filtered).map((o, index) => (
                  <OfferCard
                    key={o.id}
                    offer={o}
                    rank={page === 'matches' ? index + 1 : null}
                    onClick={() => openOffer(o)}
                  />
                ))}
                {(page === 'matches'
                  ? !busy && !apiError && !results.length
                  : !filtered.length) && (
                  <Empty text="No offerings match this search yet. Try a different category or publish an offering." />
                )}
              </>
            ) : page === 'detail' ? (
              <>
                <Header
                  title={`${selected.name.split(' ')[0]}'s ${selected.category} Help`}
                  back={() => navigate(activeNeed ? 'matches' : 'helpers')}
                />
                <div className="garden-cover">
                  <span>{selected.emoji}</span>
                  <b>
                    {selected.rate == null ? 'Rate unavailable' : `${selected.rate}`}
                    <small>{selected.rate != null && ' / hr'}</small>
                  </b>
                </div>
                <div className="person-heading">
                  <div className="avatar large">{selected.name.charAt(0)}</div>
                  <div>
                    <h2>{selected.name}</h2>
                    <p className="muted">
                      {selected.distance == null
                        ? 'Details pending from backend'
                        : `Local helper · ${selected.distance} miles away`}
                    </p>
                  </div>
                </div>
                <div className="chips green-chips">
                  <span>
                    <ShieldCheck size={13} />
                    {selected.source === 'api' ? 'API offering' : 'Demo community member'}
                  </span>
                  {selected.tools != null && (
                    <span>{selected.tools ? 'Tools included' : 'Bring your tools'}</span>
                  )}
                </div>
                <section>
                  <h2>About the Offer</h2>
                  <p className="body-copy">{selected.description}</p>
                </section>
                {selected.reasons && (
                  <section className="explanation">
                    <div className="section-heading">
                      <h2>Why this match?</h2>
                      <b>{selected.score}%</b>
                    </div>
                    <ul>
                      {selected.reasons.map((r) => (
                        <li key={r}>
                          <Check size={15} />
                          {r}
                        </li>
                      ))}
                    </ul>
                    <p className="muted">
                      {selected.source === 'api'
                        ? 'Backend match score'
                        : 'Rule-based POC score'}
                      , not a guarantee. Confirm details with your neighbor.
                    </p>
                  </section>
                )}
                {selected.source !== 'api' && (
                  <section>
                    <h2>What neighbors say</h2>
                    <div className="review">
                      <b>Sarah Jenkins</b>
                      <span>
                        <Star size={14} />
                        {selected.rating}
                      </span>
                      <p>
                        “Such a helpful neighbor. Friendly, thoughtful, and a pleasure to
                        work with.”
                      </p>
                      <small>
                        Illustrative POC review · {selected.reviews} sample reviews
                      </small>
                    </div>
                  </section>
                )}
                <div className="sticky-action">
                  <button
                    className="primary"
                    disabled={selected.source === 'api'}
                    onClick={() => navigate('chat')}
                  >
                    <MessageSquare size={17} />
                    Discuss & Coordinate
                  </button>
                  {selected.source === 'api' && (
                    <p className="muted">
                      Messaging is unavailable for API matches until the backend provides
                      owner and conversation endpoints.
                    </p>
                  )}
                </div>
              </>
            ) : page === 'need' ? (
              <NeedForm
                onBack={() => navigate('discover')}
                busy={busy}
                apiMode={apiMode}
                onSubmit={publishNeed}
              />
            ) : page === 'offer' ? (
              <OfferForm
                onBack={() => navigate('discover')}
                busy={busy}
                apiMode={apiMode}
                onSubmit={publishOffering}
              />
            ) : page === 'profile' ? (
              <>
                <Header title="Your Profile" />
                <div className="profile-card">
                  <div className="avatar large">{(profile?.name || 'C').charAt(0)}</div>
                  <h1>{profile?.name || 'Clara Miller'}</h1>
                  <p>{profile?.neighborhood || 'Sunset Valley'} · Community neighbor</p>
                  <p>{profile?.bio || 'A friendly face in the neighborhood.'}</p>
                  <button className="secondary" onClick={() => setModal(true)}>
                    {profile ? 'Edit profile' : 'Create profile'}
                  </button>
                </div>
                <section>
                  <h2>Connection</h2>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={apiMode}
                      onChange={(e) => setApiMode(e.target.checked)}
                    />
                    Use Connecto API for new posts
                  </label>
                  <p className="muted">
                    {apiMode
                      ? 'Needs and Offerings are saved to the backend. Matches use server scores and explanations.'
                      : 'Demo mode: posts and matches stay on this device.'}
                  </p>
                  <p className="muted">
                    Profiles, discovery, and conversations remain local while their API
                    routes are unfinished.
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
            ) : page === 'gigs' ? (
              <>
                <Header title="My Activity" />
                <section>
                  <div className="section-heading">
                    <h2>Your Help Requests</h2>
                    <button className="text-button" onClick={() => navigate('need')}>
                      + New
                    </button>
                  </div>
                  {needs.length ? (
                    needs.map((n) => (
                      <button
                        className="activity-card"
                        key={n.id}
                        onClick={() => showMatches(n)}
                      >
                        <span className="tag">{n.category}</span>
                        <h3>{n.title}</h3>
                        <p>
                          {n.timeframe} · ${n.budget} budget
                        </p>
                        <b>View ranked matches →</b>
                      </button>
                    ))
                  ) : (
                    <Empty text="You haven’t posted a request yet." />
                  )}
                </section>
                <section>
                  <div className="section-heading">
                    <h2>Your Offerings</h2>
                    <button className="text-button" onClick={() => navigate('offer')}>
                      + New
                    </button>
                  </div>
                  {offers
                    .filter((o) => !initialOfferings.some((seed) => seed.id === o.id))
                    .map((o) => (
                      <OfferCard key={o.id} offer={o} onClick={() => openOffer(o)} />
                    ))}
                  {offers.length === initialOfferings.length && (
                    <Empty text="Share a skill to help a neighbor." />
                  )}
                </section>
              </>
            ) : page === 'inbox' ? (
              <>
                <Header title="Inbox" />
                {Object.keys(messages).length ? (
                  Object.keys(messages).map((id) => {
                    const o = offers.find((o) => o.id === id);
                    return (
                      o && (
                        <button
                          className="activity-card"
                          key={id}
                          onClick={() => {
                            setSelected(o);
                            navigate('chat');
                          }}
                        >
                          <b>{o.name}</b>
                          <p>{messages[id].at(-1)?.text}</p>
                        </button>
                      )
                    );
                  })
                ) : (
                  <Empty text="No conversations yet. Find a neighbor and tap Discuss & Coordinate." />
                )}
              </>
            ) : page === 'chat' ? (
              <>
                <Header title={selected.name} back={() => navigate('inbox')} />
                <div className="chat-context">
                  <span className="tag">{selected.title}</span>
                  <b>${selected.rate}/hr</b>
                  <p>Coordinate timing, tools, and the scope of your request here.</p>
                </div>
                <div className="chat-messages">
                  <div className="bubble">
                    Hi! Let’s discuss what you need and find a time that works.
                  </div>
                  {(messages[selected.id] || []).map((m) => (
                    <div className="bubble sent" key={m.id}>
                      {m.text}
                    </div>
                  ))}
                </div>
                <form
                  className="message-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const text = new FormData(e.currentTarget).get('message').trim();
                    if (!text) return;
                    setMessages({
                      ...messages,
                      [selected.id]: [
                        ...(messages[selected.id] || []),
                        { id: crypto.randomUUID(), text },
                      ],
                    });
                    e.currentTarget.reset();
                  }}
                >
                  <input
                    name="message"
                    aria-label="Message neighbor"
                    placeholder={`Message ${selected.name.split(' ')[0]}…`}
                    required
                    maxLength={1000}
                  />
                  <button aria-label="Send message">
                    <Send size={20} />
                  </button>
                </form>
                <p className="muted">
                  Local demo conversation. Messages stay on this device.
                </p>
              </>
            ) : null}
          </>
        )}
        {navVisible && (
          <nav className="bottom-nav">
            {[
              ['discover', Compass, 'Discover'],
              ['gigs', ClipboardList, 'Gigs'],
              ['inbox', MessageSquare, 'Inbox'],
              ['profile', User, 'Profile'],
            ].map(([p, I, label]) => (
              <button
                key={p}
                className={page === p ? 'active' : ''}
                onClick={() => navigate(p)}
              >
                <I size={20} />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        )}
        {modal && (
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
                  setProfile(data);
                  setModal(false);
                  navigate('discover');
                  setNotice('Profile saved. Welcome to Connecto!');
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
                <label>
                  Existing API User ID
                  <input
                    name="apiUserId"
                    defaultValue={
                      profile?.apiUserId || import.meta.env.VITE_CONNECTO_USER_ID || ''
                    }
                    placeholder="Database User.Id (GUID)"
                    pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
                  />
                </label>
                <p className="muted">
                  The backend currently requires an existing database user. Saving this
                  profile does not register an API account.
                </p>
                <label>
                  A little about you
                  <textarea
                    name="bio"
                    maxLength={300}
                    defaultValue={profile?.bio || ''}
                  />
                </label>
                <button className="primary">Save Profile</button>
              </form>
            </div>
          </div>
        )}
      </main>
      <aside className="desktop-note">
        <span className="eyebrow">GOOD NEIGHBORS. GREAT CONNECTIONS.</span>
        <h1>
          A little help.
          <br />A lot of possibility.
        </h1>
        <p>
          Discover local skills, share what you know, and turn a nearby neighbor into your
          next helping hand.
        </p>
        <div className="note-card">
          <Leaf />
          <div>
            <b>Built around your neighborhood</b>
            <p>
              Thoughtful matches. Clear reasons.
              <br />
              People just around the corner.
            </p>
          </div>
        </div>
        <span className="demo-label">CONNECTO · COMMUNITY POC</span>
      </aside>
    </div>
  );
}
function SkillField({ apiMode }) {
  return (
    apiMode && (
      <>
        <label>
          Matching Skill
          <select name="skills">
            <option value="">No specific skill</option>
            {apiSkills.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <p className="muted">
          Only the skills listed here are currently supported by the backend. Hours,
          tools, radius, and the Today/Weekend preference remain local; use the date
          fields for API availability. Offering prices are sent as entered, since the API
          has no hourly-price field.
        </p>
      </>
    )
  );
}
function Header({ title, back, right }) {
  return (
    <header className="page-header">
      {back && (
        <button aria-label="Go back" onClick={back}>
          <ArrowLeft size={21} />
        </button>
      )}
      <h1>{title}</h1>
      {right}
    </header>
  );
}
function SearchBox({ query, setQuery }) {
  return (
    <div className="search-box">
      <Search size={17} />
      <input
        aria-label="Search skills or neighbors"
        placeholder="Search skills, tools, or requests…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
    </div>
  );
}
function Empty({ text }) {
  return <div className="empty">{text}</div>;
}
function OfferCard({ offer: o, onClick, rank }) {
  return (
    <button className="offer-card" onClick={onClick}>
      <div className={`offer-art art-${o.category.replaceAll(' ', '').toLowerCase()}`}>
        {o.emoji}
      </div>
      <div className="offer-info">
        <b>{o.name}</b>
        <p>{o.title}</p>
        <span className="rating">
          <Star size={12} fill="currentColor" />
          {o.reviews ? `${o.rating} (${o.reviews} reviews)` : 'New neighbor'}
        </span>
      </div>
      <div className="offer-meta">
        <b>{o.rate == null ? 'Rate unavailable' : `${o.rate}/hr`}</b>
        {rank && (
          <strong>
            #{rank} · {o.score}%
          </strong>
        )}
        <small>
          <MapPin size={11} />
          {o.distance == null ? 'Location unavailable' : `${o.distance} miles away`}
        </small>
      </div>
    </button>
  );
}
function NeedForm({ onBack, onSubmit, busy, apiMode }) {
  return (
    <>
      <Header title="Request Local Help" back={onBack} />
      <div className="progress">
        <i />
        <i />
        <i />
      </div>
      <h1 className="form-title">Describe what you need</h1>
      <p className="muted">Neighbors will send offers based on your post.</p>
      <form
        className="editor-form"
        onSubmit={(e) => {
          e.preventDefault();
          const d = Object.fromEntries(new FormData(e.currentTarget));
          onSubmit({
            ...d,
            budget: Number(d.budget),
            hours: Number(d.hours),
            radius: Number(d.radius),
            tools: d.tools === 'on',
          });
        }}
      >
        <label>
          Short Title
          <input
            name="title"
            required
            maxLength={100}
            placeholder="Raised bed garden setup & soil prep"
          />
        </label>
        <label>
          Category
          <select name="category">
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <SkillField apiMode={apiMode} />
        <label>
          Details & Materials
          <textarea
            name="description"
            required
            maxLength={2000}
            placeholder="Tell your neighbor about the task, materials, and anything they should bring."
          />
        </label>
        <div className="form-grid">
          <label>
            Est. Budget ($ total)
            <input
              name="budget"
              type="number"
              min="1"
              max="100000"
              required
              defaultValue="150"
            />
          </label>
          <label>
            Estimated Hours
            <input
              name="hours"
              type="number"
              min="0.5"
              max="1000"
              step="0.5"
              required
              defaultValue="3"
            />
          </label>
          <label>
            Timeframe
            <select name="timeframe">
              <option>This Weekend</option>
              <option>Today</option>
              <option>Flexible</option>
            </select>
          </label>
          <label>
            Search Radius (miles)
            <input
              name="radius"
              type="number"
              min="0.1"
              max="100"
              step="0.1"
              required
              defaultValue="3"
            />
          </label>
        </div>
        <label className="checkbox">
          <input name="tools" type="checkbox" defaultChecked />
          Helper should bring tools
        </label>
        {apiMode && (
          <label>
            Deadline (optional)
            <input type="datetime-local" name="deadline" />
          </label>
        )}
        <div className="sticky-action">
          <button className="primary" disabled={busy}>
            {busy ? 'Posting…' : 'Post Help Request'}
          </button>
        </div>
      </form>
    </>
  );
}
function OfferForm({ onBack, onSubmit, busy, apiMode }) {
  return (
    <>
      <Header title="Offer Your Skills" back={onBack} />
      <h1 className="form-title">List a local skill or resource</h1>
      <p className="muted">
        Set up what you do best and how neighbors can use your time.
      </p>
      <form
        className="editor-form"
        onSubmit={(e) => {
          e.preventDefault();
          const d = Object.fromEntries(new FormData(e.currentTarget));
          onSubmit({ ...d, rate: Number(d.rate), tools: d.tools === 'on' });
        }}
      >
        <label>
          Skill / Service Name
          <input
            name="title"
            required
            maxLength={100}
            placeholder="Bicycle Tuning & Chain Maintenance"
          />
        </label>
        <label>
          Category
          <select name="category">
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <SkillField apiMode={apiMode} />
        <label>
          About your offering
          <textarea
            name="description"
            required
            maxLength={2000}
            placeholder="Describe your skills and experience."
          />
        </label>
        <div className="form-grid">
          <label>
            Your Rate ($ / hr)
            <input
              name="rate"
              type="number"
              required
              min="1"
              max="10000"
              defaultValue="30"
            />
          </label>
          <label>
            Availability
            <select name="availability">
              <option>This Weekend</option>
              <option>Today</option>
              <option>Flexible</option>
            </select>
          </label>
        </div>
        <label className="checkbox">
          <input name="tools" type="checkbox" defaultChecked />
          Yes, I bring my tools
        </label>
        {apiMode && (
          <>
            <label>
              Experience (years)
              <input
                name="experienceYears"
                type="number"
                min="0"
                max="100"
                defaultValue="0"
              />
            </label>
            <div className="form-grid">
              <label>
                Available From
                <input name="availableFrom" type="datetime-local" />
              </label>
              <label>
                Available Until
                <input name="availableUntil" type="datetime-local" />
              </label>
            </div>
          </>
        )}
        <div className="showcase">
          <Briefcase />
          <p>
            Your skill is the starting point.
            <br />
            Tell neighbors what makes it special.
          </p>
        </div>
        <div className="sticky-action">
          <button className="primary green-button" disabled={busy}>
            {busy ? 'Publishing…' : 'Publish Your Skill'}
          </button>
        </div>
      </form>
    </>
  );
}
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

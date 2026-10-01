import { Users, Compass, ClipboardList, MessageSquare, User } from 'lucide-react';
export default function Sidebar({ page, navigate }) {
  return (
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
  );
}

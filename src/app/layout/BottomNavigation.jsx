import { Compass, ClipboardList, MessageSquare, User } from 'lucide-react';
export default function BottomNavigation({ page, navigate }) {
  return (
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
  );
}

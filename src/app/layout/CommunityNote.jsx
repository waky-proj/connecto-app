import { Leaf } from 'lucide-react';
export default function CommunityNote() {
  return (
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
  );
}

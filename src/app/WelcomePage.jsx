import { Users, Search, Briefcase } from 'lucide-react';
export default function WelcomePage({ navigate }) {
  return (
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
        <button className="primary" onClick={() => navigate('register')}>
          Create Your Profile
        </button>
        <p>
          Already have a local profile?{' '}
          <button className="text-button" onClick={() => navigate('login')}>
            Sign In
          </button>
        </p>
        <small>This POC saves your profile on this device.</small>
      </div>
    </>
  );
}

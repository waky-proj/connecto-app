import { useState } from 'react';
import { ArrowLeft, Users, Eye, EyeOff, Mail, LockKeyhole } from 'lucide-react';
export default function AuthScreen({ mode, onBack, onSwitch, onPreview, profile }) {
  const register = mode === 'register';
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [neighborhood, setNeighborhood] = useState('Sunset Valley');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  function submit(event) {
    event.preventDefault();
    if (register && password !== confirmation) {
      setError('Your passwords do not match. Please check them and try again.');
      return;
    }
    setError(
      register
        ? 'Account registration is not available yet. You can create a local preview profile below.'
        : 'Account login is not available yet. You can continue with a saved local profile, if you have one.',
    );
  }
  function preview() {
    if (!name.trim() || !neighborhood.trim()) {
      setError('Enter your name and neighborhood to create a local preview profile.');
      return;
    }
    // Passwords are intentionally excluded from the local profile.
    onPreview({ name: name.trim(), neighborhood: neighborhood.trim(), bio: '' });
  }
  return (
    <div className="auth-screen">
      <button className="auth-back" onClick={onBack}>
        <ArrowLeft size={18} />
        Back
      </button>
      <div className="brand auth-brand">
        <span>
          <Users size={24} />
        </span>
        Connecto
      </div>
      <div className="auth-intro">
        <span className="eyebrow">YOUR NEIGHBORHOOD STARTS HERE</span>
        <h1>
          {register
            ? 'A friendly face.\nA fresh connection.'
            : 'Welcome back,\nneighbor.'}
        </h1>
        <p>
          {register
            ? 'Join a community of people ready to lend a hand. A little help goes a long way.'
            : 'Find your people, share your skills, and pick up where you left off.'}
        </p>
      </div>
      <div className="auth-tabs" aria-label="Account screens">
        <button className={!register ? 'selected' : ''} onClick={() => onSwitch('login')}>
          Log in
        </button>
        <button
          className={register ? 'selected' : ''}
          onClick={() => onSwitch('register')}
        >
          Create account
        </button>
      </div>
      <form onSubmit={submit} className="auth-form">
        {register && (
          <>
            <label>
              Full name
              <input
                name="name"
                autoComplete="name"
                required
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Clara Miller"
              />
            </label>
            <label>
              Neighborhood
              <input
                name="neighborhood"
                autoComplete="address-level2"
                required
                maxLength={60}
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
              />
            </label>
          </>
        )}
        <label>
          Email address
          <div className="auth-input">
            <Mail size={17} />
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
        </label>
        <label>
          Password
          <div className="auth-input">
            <LockKeyhole size={17} />
            <input
              name="password"
              type={visible ? 'text' : 'password'}
              autoComplete={register ? 'new-password' : 'current-password'}
              required
              minLength={register ? 8 : 1}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={register ? 'At least 8 characters' : 'Enter your password'}
            />
            <button
              type="button"
              aria-label={visible ? 'Hide password' : 'Show password'}
              aria-pressed={visible}
              onClick={() => setVisible(!visible)}
            >
              {visible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        {register && (
          <label>
            Confirm password
            <input
              name="confirmation"
              type={visible ? 'text' : 'password'}
              autoComplete="new-password"
              required
              maxLength={128}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="Re-enter your password"
            />
          </label>
        )}
        {error && (
          <div className="api-error" role="alert">
            {error}
          </div>
        )}
        <button className="primary">{register ? 'Create Account' : 'Log In'}</button>
        <p className="auth-note">
          Screen preview: backend authentication is not implemented. Credentials are not
          sent or saved.
        </p>
      </form>
      <div className="auth-preview">
        <b>Explore the POC</b>
        <p>
          {register
            ? 'Use your name and neighborhood to try the app locally. No email or password required.'
            : 'A local profile lets you try the app on this device. It does not sign you into a server account.'}
        </p>
        {register ? (
          <button className="secondary" onClick={preview}>
            Create local preview profile
          </button>
        ) : (
          <>
            <button
              className="secondary"
              disabled={!profile}
              onClick={() => onPreview(profile)}
            >
              Continue with saved local profile
            </button>
            {!profile && (
              <button className="text-button" onClick={() => onSwitch('register')}>
                Create a local preview profile
              </button>
            )}
          </>
        )}
      </div>
      <p className="auth-switch">
        {register ? 'Already a neighbor?' : 'New around here?'}{' '}
        <button
          className="text-button"
          onClick={() => onSwitch(register ? 'login' : 'register')}
        >
          {register ? 'Log in' : 'Create account'}
        </button>
      </p>
    </div>
  );
}

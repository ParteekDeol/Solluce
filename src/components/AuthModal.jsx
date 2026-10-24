import { useState } from 'react';
import { ArrowRight, Mail, Leaf } from 'lucide-react';
import { Modal, Notice, Spinner, Brand } from './ui';
import { firebaseReady, googleSignIn, emailSignIn, resetPassword, authError } from '../lib/firebase';

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  async function run(action) {
    setBusy(true); setError(''); setMessage('');
    try { await action(); if (mode !== 'reset') onClose(); else setMessage('If an account exists for this email, a password reset link is on its way.'); }
    catch (err) { setError(authError(err)); }
    finally { setBusy(false); }
  }
  return <Modal title={mode === 'signup' ? 'Room to grow.' : mode === 'reset' ? 'A fresh start.' : 'Welcome to Solluce.'} onClose={onClose}>
    <div className="auth-intro"><span className="auth-leaf"><Leaf size={25}/></span><p>Keep your fields, insights, and next steps together.<br/>A little continuity makes a big difference.</p></div>
    {!firebaseReady ? <Notice>Accounts are being connected. You can explore Solluce as a guest now. Saved fields and history will be available when Firebase is configured.</Notice> : <>
      {mode !== 'reset' && <button className="button google-button" disabled={busy} onClick={() => run(googleSignIn)}><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.2h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c1.9-1.8 2.9-4.3 2.9-7.5Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 14c-.4-1.3-.4-2.7 0-4V7.4H3a10 10 0 0 0 0 9.2L6.4 14Z"/><path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.6 9.6 0 0 0 12 2a10 10 0 0 0-9 5.4L6.4 10c.8-2.3 3-4.1 5.6-4.1Z"/></svg>Continue with Google</button>}
      {mode !== 'reset' && <div className="divider-label">or use your email</div>}
      <form className="form-stack" onSubmit={e => { e.preventDefault(); run(() => mode === 'reset' ? resetPassword(email) : emailSignIn(email, password, mode === 'signup' ? name.trim() : null)); }}>
        {mode === 'signup' && <label>Your name<input required minLength={2} maxLength={60} autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="What should we call you?" /></label>}
        <label>Email address<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@yourfarm.com" /></label>
        {mode !== 'reset' && <label>Password<input required type="password" minLength={mode === 'signup' ? 8 : 1} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'signup' ? 'At least 8 characters' : 'Your password'} /></label>}
        {error && <Notice tone="error">{error}</Notice>}{message && <Notice tone="success">{message}</Notice>}
        <button className="button primary full" disabled={busy}>{busy ? <Spinner label="One moment…"/> : <>{mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}<ArrowRight size={17}/></>}</button>
      </form>
      <div className="auth-options"><button onClick={() => {setMode(mode === 'signin' ? 'signup' : 'signin');setError('');setMessage('');}}>{mode === 'signin' ? 'New here? Create an account' : 'Already registered? Sign in'}</button>{mode === 'signin' && <button onClick={() => setMode('reset')}>Forgot password?</button>}</div>
    </>}
    <button className="button secondary full guest-button" onClick={onClose}>Continue as a guest<ArrowRight size={16}/></button>
    <p className="fine-print">Guest checks stay in this session. Sign in to save your fields and analysis history.</p>
  </Modal>;
}

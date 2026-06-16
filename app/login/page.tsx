'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  async function handleMagicLink() {
    setLoading(true)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    })
    if (!error) setSent(true)
    setLoading(false)
  }

  async function handleGoogle() {
    setGoogleLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }

        .login-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          font-family: 'DM Sans', sans-serif;
        }

        /* ── Left panel ── */
        .left-panel {
          background: #18181b;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px;
          position: relative;
          overflow: hidden;
        }

        .left-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 30% 50%, #e8291c22 0%, transparent 60%);
          pointer-events: none;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          z-index: 1;
        }

        .brand-icon {
          width: 36px; height: 36px;
          background: #e8291c;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
        }

        .brand-name {
          font-family: 'Oswald', sans-serif;
          font-size: 22px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.02em;
        }

        .left-content {
          z-index: 1;
        }

        .left-headline {
          font-family: 'Oswald', sans-serif;
          font-size: clamp(32px, 3.5vw, 52px);
          font-weight: 700;
          color: #fff;
          line-height: 1.1;
          letter-spacing: -0.01em;
          margin-bottom: 16px;
        }

        .left-headline em {
          font-style: normal;
          color: #e8291c;
        }

        .left-sub {
          font-size: 15px;
          color: #a1a1aa;
          line-height: 1.6;
          max-width: 340px;
        }

        .features {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 36px;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #d4d4d8;
          font-size: 14px;
        }

        .feature-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #e8291c;
          flex-shrink: 0;
        }

        .left-footer {
          font-size: 12px;
          color: #52525b;
          z-index: 1;
        }

        /* ── Right panel ── */
        .right-panel {
          background: #fafafa;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 40px;
        }

        .form-box {
          width: 100%;
          max-width: 380px;
        }

        .form-title {
          font-family: 'Oswald', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: #18181b;
          margin-bottom: 6px;
        }

        .form-sub {
          font-size: 14px;
          color: #71717a;
          margin-bottom: 32px;
          font-weight: 300;
        }

        .google-btn {
          width: 100%;
          padding: 11px 16px;
          border-radius: 10px;
          border: 1.5px solid #e4e4e7;
          background: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: #18181b;
          cursor: pointer;
          transition: all 0.15s ease;
          margin-bottom: 20px;
        }

        .google-btn:hover {
          border-color: #a1a1aa;
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        }

        .google-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: #e4e4e7;
        }

        .divider-text {
          font-size: 12px;
          color: #a1a1aa;
          white-space: nowrap;
        }

        .input {
          width: 100%;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1.5px solid #e4e4e7;
          background: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #18181b;
          outline: none;
          transition: border-color 0.15s;
          margin-bottom: 12px;
        }

        .input:focus {
          border-color: #18181b;
        }

        .submit-btn {
          width: 100%;
          padding: 11px 16px;
          border-radius: 10px;
          background: #18181b;
          color: #fff;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: opacity 0.15s;
        }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .submit-btn:hover:not(:disabled) {
          opacity: 0.85;
        }

        .terms {
          font-size: 11px;
          color: #a1a1aa;
          text-align: center;
          margin-top: 20px;
          line-height: 1.5;
        }

        /* Sent state */
        .sent-box {
          text-align: center;
          padding: 32px 0;
        }

        .sent-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .sent-title {
          font-family: 'Oswald', sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #18181b;
          margin-bottom: 8px;
        }

        .sent-sub {
          font-size: 14px;
          color: #71717a;
          line-height: 1.6;
        }

        .sent-sub strong {
          color: #18181b;
        }

        /* Mobile */
        @media (max-width: 680px) {
          .login-page { grid-template-columns: 1fr; }
          .left-panel { display: none; }
          .right-panel { padding: 48px 24px; }
        }
      `}</style>

      <div className="login-page">
        {/* ── Left panel ── */}
        <div className="left-panel">
          <div className="brand">
            <div className="brand-icon">⚾</div>
            <span className="brand-name">myTeam</span>
          </div>

          <div className="left-content">
            <h1 className="left-headline">
              Your team.<br />
              Your <em>feed.</em>
            </h1>
            <p className="left-sub">
              Scores, live game updates, news and fan takes — all for the one team you actually care about.
            </p>
            <div className="features">
              <div className="feature">
                <div className="feature-dot" />
                Live scores & in-game updates
              </div>
              <div className="feature">
                <div className="feature-dot" />
                Latest news from top sources
              </div>
              <div className="feature">
                <div className="feature-dot" />
                Hot takes from your team's subreddit
              </div>
              <div className="feature">
                <div className="feature-dot" />
                Pick once, always land on your team
              </div>
            </div>
          </div>

          <div className="left-footer">
            © 2026 myTeam · MLB data via ESPN
          </div>
        </div>

        {/* ── Right panel ── */}
        <div className="right-panel">
          <div className="form-box">
            {sent ? (
              <div className="sent-box">
                <div className="sent-icon">✉️</div>
                <h2 className="sent-title">Check your inbox</h2>
                <p className="sent-sub">
                  We sent a magic link to<br />
                  <strong>{email}</strong><br /><br />
                  Click the link in the email to sign in.
                </p>
              </div>
            ) : (
              <>
                <h2 className="form-title">Welcome back</h2>
                <p className="form-sub">Sign in to access your team feed</p>

                {/* Google */}
                <button
                  className="google-btn"
                  onClick={handleGoogle}
                  disabled={googleLoading}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                    <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 6.294C4.672 4.169 6.656 3.58 9 3.58z"/>
                  </svg>
                  {googleLoading ? 'Redirecting…' : 'Continue with Google'}
                </button>

                <div className="divider">
                  <div className="divider-line" />
                  <span className="divider-text">or continue with email</span>
                  <div className="divider-line" />
                </div>

                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleMagicLink()}
                  placeholder="you@example.com"
                />
                <button
                  className="submit-btn"
                  onClick={handleMagicLink}
                  disabled={loading || !email}
                >
                  {loading ? 'Sending…' : 'Send Magic Link'}
                </button>

                <p className="terms">
                  By signing in you agree to our terms of service.<br />
                  No password needed — we'll email you a link.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
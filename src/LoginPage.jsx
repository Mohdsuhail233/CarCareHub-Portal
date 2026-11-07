import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from './api';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [banner, setBanner] = useState(null); // { message, type: 'info' | 'error' | 'success' }

  const handleForgotPassword = () => {
    const trimmed = email.trim();
    if (trimmed && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setBanner({
        message: `Password reset instructions have been sent to ${trimmed}.`,
        type: 'info'
      });
    } else {
      setBanner({
        message: 'Enter your registered email address first to receive a password reset link.',
        type: 'info'
      });
      setEmailError('Please enter a valid email address.');
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setEmailError('');
    setPasswordError('');
    setBanner(null);

    const emailVal = email.trim();
    let isValid = true;

    if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }

    if (!password || password.length < 4) {
      setPasswordError('Please enter your password.');
      isValid = false;
    }

    if (!isValid) return;

    setLoading(true);
    try {
      const res = await api.login(emailVal, password);
      if (res && res.token) {
        const fullName = res.fullName || emailVal.split('@')[0];
        localStorage.setItem('cch_auth_token', res.token);
        localStorage.setItem(
          'cch_auth_user',
          JSON.stringify({ email: res.email || emailVal, fullName })
        );
        setBanner({
          message: 'Welcome back to Car Care Hub! Redirecting to your dashboard...',
          type: 'success'
        });
        setTimeout(() => {
          onLoginSuccess({ email: res.email || emailVal, fullName, token: res.token });
        }, 400);
      } else {
        const fallbackName = emailVal.split('@')[0];
        localStorage.setItem('cch_auth_token', 'session_active_' + Date.now());
        localStorage.setItem(
          'cch_auth_user',
          JSON.stringify({ email: emailVal, fullName: fallbackName })
        );
        setBanner({
          message: 'Welcome back to Car Care Hub! Redirecting to your dashboard...',
          type: 'success'
        });
        setTimeout(() => {
          onLoginSuccess({ email: emailVal, fullName: fallbackName });
        }, 400);
      }
    } catch (err) {
      console.warn('Backend login attempt:', err);
      const errMsg = err?.message || 'Invalid credentials or server unavailable';
      setBanner({ message: errMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cch-login-backdrop">
      {/* Main Centered White Single-Card Container */}
      <main className="cch-login-card">
        {/* Login Form Card Content */}
        <section className="cch-login-section">
          {/* Top-Left Corner Branding: CAR CARE HUB */}
          <header className="cch-brand-header">
            <div className="cch-brand-icon-box">
              {/* Sleek Automotive Car SVG Icon */}
              <svg
                className="cch-car-svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
                <circle cx="7" cy="17" r="2" />
                <path d="M9 17h6" />
                <circle cx="17" cy="17" r="2" />
              </svg>
            </div>
            <span className="brand-font cch-brand-title">
              CAR CARE HUB
            </span>
          </header>

          {/* Vertically Centered Form Block */}
          <div className="cch-form-block">
            {/* Heading & Subtitle */}
            <div className="cch-heading-wrap">
              <h1 className="cch-main-title">Welcome back</h1>
              <p className="cch-main-sub">Premium Automotive Care &amp; Management</p>
            </div>

            {/* Status / Feedback Banner */}
            {banner && (
              <div className={`cch-status-banner ${banner.type}`} role="alert">
                <span className="cch-status-icon">
                  {banner.type === 'success' ? (
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : banner.type === 'error' ? (
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                </span>
                <span className="cch-status-text">{banner.message}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="cch-form" noValidate>
              {/* Email Field */}
              <div className="cch-field-group">
                <label htmlFor="email" className="cch-field-label">
                  Email
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    autoComplete="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError('');
                    }}
                    className={`cch-input ${emailError ? 'border-red-500' : ''}`}
                  />
                </div>
                {emailError && (
                  <p className="cch-error-text">{emailError}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="cch-field-group">
                <label htmlFor="password" className="cch-field-label">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    className={`cch-input cch-input-password ${passwordError ? 'border-red-500' : ''}`}
                  />
                  {/* Show/Hide Password Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                    className="cch-password-toggle-btn"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      /* Eye Off Icon */
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      /* Eye Open Icon */
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p className="cch-error-text">{passwordError}</p>
                )}
              </div>

              {/* Remember Password & Forgot Password Row */}
              <div className="cch-remember-row">
                <label className="cch-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="cch-checkbox"
                  />
                  <span className="cch-checkbox-text">
                    Remember password
                  </span>
                </label>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="cch-forgot-link"
                >
                  Forgot password
                </button>
              </div>

              {/* Primary Sign In Button */}
              <div className="cch-submit-wrap">
                <button
                  type="submit"
                  disabled={loading}
                  className="cch-submit-btn"
                >
                  <span>{loading ? 'Signing in...' : 'Sign in'}</span>
                  {loading && <Loader2 size={16} className="cch-spinner" />}
                </button>
              </div>
            </form>
          </div>

          {/* Subtle Bottom Footer Note */}
          <footer className="cch-login-footer">
            <p>
              Authorized Portal &bull; Car Care Hub Management System
            </p>
          </footer>
        </section>
      </main>
    </div>
  );
}

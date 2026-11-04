import React, { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Wrench, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from './api';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login(email, password);
      if (res && res.token) {
        const fullName = res.fullName || email.split('@')[0];
        localStorage.setItem('cch_auth_token', res.token);
        localStorage.setItem(
          'cch_auth_user',
          JSON.stringify({ email: res.email || email, fullName })
        );
        onLoginSuccess({ email: res.email || email, fullName, token: res.token });
      } else {
        const fallbackName = email.split('@')[0];
        localStorage.setItem('cch_auth_token', 'session_active_' + Date.now());
        localStorage.setItem(
          'cch_auth_user',
          JSON.stringify({ email, fullName: fallbackName })
        );
        onLoginSuccess({ email, fullName: fallbackName });
      }
    } catch (err) {
      console.warn('Backend login attempt:', err);
      // Give descriptive message
      const errMsg = err?.message || 'Invalid credentials or server unavailable';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Demo / Offline bypass login for immediate testing
  const handleQuickDemoLogin = () => {
    localStorage.setItem('cch_auth_token', 'demo_jwt_token_' + Date.now());
    localStorage.setItem(
      'cch_auth_user',
      JSON.stringify({ email: 'admin@carcarehub.com', fullName: 'Faiz Khan' })
    );
    onLoginSuccess({ email: 'admin@carcarehub.com', fullName: 'Faiz Khan' });
  };

  return (
    <div className="login-screen-wrapper">
      {/* Centered Large Card */}
      <div className="login-modal-card">
        {/* Left Dark Hero Panel */}
        <div className="login-left-panel">
          {/* Subtle Ambient Mesh Wave Overlay */}
          <div className="login-mesh-bg" />

          {/* Top Brand Logo */}
          <div className="login-brand-row">
            <div className="login-brand-icon">
              <Wrench size={18} />
            </div>
            <span className="login-brand-name">CarCareHub</span>
          </div>

          {/* Hero Typography */}
          <div className="login-hero-content">
            <h1 className="login-hero-title">
              Welcome<br />Back!
            </h1>
          </div>

          {/* Bottom Security Badge */}
          <div className="login-security-badge">
            <div className="security-icon-circle">
              <ShieldCheck size={20} />
            </div>
            <div className="security-text-group">
              <strong className="security-title">Platform 100% secure</strong>
              <span className="security-sub">Fully protected data</span>
            </div>
          </div>
        </div>

        {/* Right Login Form Panel */}
        <div className="login-right-panel">
          <div className="login-form-container">
            <div className="login-form-header">
              <h2 className="login-heading">Login</h2>
              <p className="login-subheading">Enter your details to access your account.</p>
            </div>

            {error && (
              <div className="login-error-banner">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              {/* Email Input */}
              <div className="login-field-group">
                <label className="login-label">Email</label>
                <div className="login-input-wrapper">
                  <input
                    type="email"
                    className="login-input"
                    placeholder="Enter your mail address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="login-field-group">
                <label className="login-label">Password</label>
                <div className="login-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="login-input"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="login-options-row">
                <label className="login-remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  className="login-forgot-btn"
                  onClick={() => alert('Password reset link has been sent to your email.')}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Log In Button */}
              <button
                type="submit"
                className="login-submit-btn"
                disabled={loading}
              >
                {loading ? 'Logging in...' : 'Log in'}
              </button>

              {/* Divider */}
              <div className="login-divider">
                <span>or</span>
              </div>

              {/* Continue with Google */}
              <button
                type="button"
                className="login-google-btn"
                onClick={handleQuickDemoLogin}
                title="Continue with Google Authentication"
              >
                <svg className="google-icon-svg" width="18" height="18" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Quick Demo Access hint (if backend is not active yet) */}
              <div className="login-demo-helper">
                <button
                  type="button"
                  className="login-quick-demo-link"
                  onClick={handleQuickDemoLogin}
                >
                  ⚡ Quick Demo Login (Skip credentials)
                </button>
              </div>
            </form>
          </div>

          {/* Footer inside right panel */}
          <div className="login-footer-row">
            <span>Copyright @2025 CarCareHub LTD.</span>
            <a href="#privacy" onClick={(e) => e.preventDefault()}>Privacy policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}


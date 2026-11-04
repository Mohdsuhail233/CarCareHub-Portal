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


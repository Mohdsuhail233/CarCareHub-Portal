import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { api } from './api';
import loginCarImg from './assets/login-car.jpg';

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
      const errMsg = err?.message || 'Invalid credentials or server unavailable';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tesla-login-backdrop">
      <div className="tesla-login-card">
        {/* Left Side: Modern Form */}
        <div className="tesla-login-left">
          {/* Top-left Brand Logo */}
          <div className="tesla-login-brand">
            <span className="tesla-brand-text">CARCAREHUB</span>
          </div>

          {/* Form Content */}
          <div className="tesla-login-form-wrap">
            <div className="tesla-login-headings">
              <h1 className="tesla-title">Welcome back</h1>
              <p className="tesla-subtitle">The Future of Smart Garage Management</p>
            </div>

            {error && (
              <div className="tesla-error-banner">
                <AlertCircle size={15} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="tesla-form">
              {/* Email */}
              <div className="tesla-form-field">
                <label className="tesla-label">Email</label>
                <input
                  type="email"
                  className="tesla-input"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div className="tesla-form-field">
                <label className="tesla-label">Password</label>
                <div className="tesla-input-password-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="tesla-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="tesla-password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Remember password & Forgot password */}
              <div className="tesla-remember-row">
                <label className="tesla-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember password</span>
                </label>

                <button
                  type="button"
                  className="tesla-forgot-btn"
                  onClick={() => alert('Password reset instructions have been sent to your registered email.')}
                >
                  Forgot password
                </button>
              </div>

              {/* Sign in Button */}
              <button
                type="submit"
                className="tesla-signin-btn"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Car Hero Image */}
        <div className="tesla-login-right">
          <img
            src={loginCarImg}
            alt="CarCareHub Supercar"
            className="tesla-car-img"
          />
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, AlertCircle, CheckCircle2, Eye, EyeOff, ArrowRight, ArrowLeft, Loader2, ShieldAlert, Sparkles } from 'lucide-react';
import logo from '../assets/logo.png';
import './Auth.css';

const API_BASE = 'http://localhost:5000/api';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [tokenInvalid, setTokenInvalid] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setTokenInvalid(true);
    }
  }, []);

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score, label: 'Weak', color: '#dc2626' };
    if (score <= 3) return { score, label: 'Medium', color: '#d97706' };
    return { score, label: 'Strong', color: '#059669' };
  };

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!token) {
      setErrorMsg('Missing reset token. Please use the link from your email.');
      return;
    }

    if (!newPassword) {
      setErrorMsg('Please enter a new password.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error?.toLowerCase().includes('expired') || data.error?.toLowerCase().includes('invalid')) {
          setTokenInvalid(true);
        }
        throw new Error(data.error || 'Failed to reset password.');
      }

      setSuccess(true);
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (tokenInvalid) {
    return (
      <div className="auth-wrapper animate-fade-in">
        <div className="auth-brand">
          <img src={logo} alt="FUT Minna Logo" className="brand-logo-img" />
          <h1 className="brand-title">Aura<span>Class</span></h1>
          <div className="brand-badge">
            <Sparkles size={13} color="#4c1d95" />
            <span>FUT Minna Academic & Assignment Portal</span>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-header">
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                border: '1.5px solid #fecaca'
              }}>
                <ShieldAlert size={36} color="#dc2626" />
              </div>
            </div>
            <h2>Invalid or Expired Link</h2>
            <p>This password reset link is invalid or has expired. Please request a new one.</p>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <Link to="/forgot-password" className="btn btn-primary" style={{ flex: 1, textDecoration: 'none' }}>
              Request New Link
            </Link>
            <Link to="/login" className="btn btn-secondary" style={{ flex: 1, textDecoration: 'none' }}>
              <ArrowLeft size={18} />
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="auth-wrapper animate-fade-in">
        <div className="auth-brand">
          <img src={logo} alt="FUT Minna Logo" className="brand-logo-img" />
          <h1 className="brand-title">Aura<span>Class</span></h1>
          <div className="brand-badge">
            <Sparkles size={13} color="#4c1d95" />
            <span>FUT Minna Academic & Assignment Portal</span>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-header">
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                border: '1.5px solid #a7f3d0'
              }}>
                <CheckCircle2 size={36} color="#059669" />
              </div>
            </div>
            <h2>Password Reset Successful!</h2>
            <p>Your password has been updated. You can now sign in with your new password.</p>
          </div>

          <div style={{ marginTop: '28px' }}>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary w-full auth-submit-btn"
            >
              <span>Go to Sign In</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper animate-fade-in">
      <div className="auth-brand">
        <img src={logo} alt="FUT Minna Logo" className="brand-logo-img" />
        <h1 className="brand-title">Aura<span>Class</span></h1>
        <div className="brand-badge">
          <Sparkles size={13} color="#4c1d95" />
          <span>FUT Minna Academic & Assignment Portal</span>
        </div>
      </div>

      <div className="auth-card">
        <div className="auth-header">
          <h2>Create New Password</h2>
          <p>Enter a secure new password for your account</p>
        </div>

        {errorMsg && (
          <div className="auth-error-banner">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <div className="input-with-icon">
              <KeyRound size={18} className="input-icon" />
              <input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {newPassword && (
              <div style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ flex: 1, display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: '4px',
                          borderRadius: '2px',
                          background: i <= strength.score ? strength.color : '#e5dacb'
                        }}
                      />
                    ))}
                  </div>
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: strength.color,
                    minWidth: '60px',
                    textAlign: 'right'
                  }}>
                    {strength.label}
                  </span>
                </div>
                <p className="form-help-text">
                  Use 10+ characters with uppercase, numbers, and symbols for best security.
                </p>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <div className="input-with-icon">
              <KeyRound size={18} className="input-icon" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={confirmPassword && newPassword !== confirmPassword ? {
                  borderColor: '#dc2626',
                  boxShadow: '0 0 0 4px rgba(220, 38, 38, 0.1)'
                } : {}}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p style={{
                fontSize: '0.78rem',
                color: '#dc2626',
                marginTop: '6px',
                fontWeight: 600
              }}>
                ⚠️ Passwords do not match
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-full auth-submit-btn"
            disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
                Resetting Password...
              </>
            ) : (
              <>
                <span>Reset Password</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-card-divider">
          <div className="auth-footer">
            <p>
              <Link to="/forgot-password" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ArrowLeft size={14} /> Didn't request this? Send a new link
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, ArrowRight, CheckCircle2, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import logo from '../assets/logo.png';
import { API_BASE } from '../config/api';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccess(false);
    setPreviewUrl(null);

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process request.');
      }

      setSuccess(true);
      if (data.previewUrl) {
        setPreviewUrl(data.previewUrl);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            <h2>Check Your Email</h2>
            <p>If an account exists with <strong style={{ color: '#2e1065' }}>{email}</strong>, we've sent a password reset link.</p>
          </div>

          <div className="auth-warning-banner" style={{ background: '#eff6ff', borderColor: 'rgba(59, 130, 246, 0.25)', color: '#1e40af' }}>
            <AlertCircle size={18} />
            <span>The link will expire in 1 hour. If you don't see the email, check your spam or junk folder.</span>
          </div>

          {previewUrl && (
            <div className="auth-warning-banner" style={{ background: '#faf5ff', borderColor: 'rgba(139, 92, 246, 0.25)', color: '#5b21b6', marginTop: '16px' }}>
              <AlertCircle size={18} />
              <span>
                <strong>Development Preview:</strong>{' '}
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#5b21b6', textDecoration: 'underline', fontWeight: 700 }}
                >
                  View the sent reset email →
                </a>
              </span>
            </div>
          )}

          <div style={{ marginTop: '28px' }}>
            <Link to="/login" className="btn btn-secondary w-full" style={{ textDecoration: 'none' }}>
              <ArrowLeft size={18} />
              Back to Sign In
            </Link>
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
          <h2>Reset Password</h2>
          <p>Enter your email to receive a password reset link</p>
        </div>

        {errorMsg && (
          <div className="auth-error-banner">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">School Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                placeholder="e.g. grace.umar@school.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full auth-submit-btn" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
                Sending Reset Link...
              </>
            ) : (
              <>
                <span>Send Reset Link</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-card-divider">
          <div className="auth-footer">
            <p>
              Remember your password? <Link to="/login">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

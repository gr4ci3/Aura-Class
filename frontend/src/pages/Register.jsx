import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, KeyRound, Building2, Calendar, AlertCircle, Sparkles, ArrowRight, Eye, EyeOff } from 'lucide-react';
import logo from '../assets/logo.png';
import './Auth.css';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('student'); // 'student' | 'lecturer'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [department, setDepartment] = useState('Computer Engineering');
  const [admissionYear, setAdmissionYear] = useState('2024/2025');
  const [matricNumber, setMatricNumber] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [warningMsg, setWarningMsg] = useState('');

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setErrorMsg('');
    setWarningMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !department) {
      setErrorMsg('Please fill in all standard fields.');
      return;
    }

    if (role === 'student') {
      if (!admissionYear) {
        setErrorMsg('Students must specify their admission year/set.');
        return;
      }
      if (!matricNumber.trim()) {
        setErrorMsg('Students must provide their Matriculation Number (e.g. 2024/1/89402CE).');
        return;
      }
    }

    setLoading(true);
    setErrorMsg('');
    setWarningMsg('');

    const userData = {
      name,
      email,
      password,
      role,
      department,
      admissionYear: role === 'student' ? admissionYear : null,
      matricNumber: role === 'student' ? matricNumber.trim().toUpperCase() : null
    };

    try {
      const result = await register(userData);
      
      if (result.warning) {
        setWarningMsg(result.warning);
        // If there's a warning but it succeeded, we delay redirect slightly or wait for user to click
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

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

      <div className="auth-card register-card">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Register to manage or view courses and assignments</p>
        </div>

        {/* Role Selector Tabs */}
        <div className="role-selector">
          <button
            type="button"
            className={`role-tab ${role === 'student' ? 'active' : ''}`}
            onClick={() => handleRoleChange('student')}
          >
            <User size={16} /> Student
          </button>
          <button
            type="button"
            className={`role-tab ${role === 'lecturer' ? 'active' : ''}`}
            onClick={() => handleRoleChange('lecturer')}
          >
            👨‍🏫 Lecturer
          </button>
        </div>

        {errorMsg && (
          <div className="auth-error-banner">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {warningMsg && (
          <div className="auth-warning-banner">
            <Sparkles size={18} />
            <span>{warningMsg}. Redirecting to dashboard...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                id="name"
                type="text"
                placeholder="e.g. Grace Umar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

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

          <div className="form-group">
            <label htmlFor="password">Create Password</label>
            <div className="input-with-icon">
              <KeyRound size={18} className="input-icon" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
          </div>

          <div className="form-group">
            <label htmlFor="department">Department</label>
            <div className="input-with-icon">
              <Building2 size={18} className="input-icon" />
              <select
                id="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              >
                <option value="Computer Engineering">Computer Engineering</option>
                <option value="Electrical Engineering">Electrical Engineering</option>
                <option value="Telecommunication Engineering">Telecommunication Engineering</option>
                <option value="Mechatronics Engineering">Mechatronics Engineering</option>
              </select>
            </div>
          </div>

          {/* Conditional Student-only fields */}
          {role === 'student' && (
            <>
              <div className="form-group animate-fade-in">
                <label htmlFor="matricNumber">Matriculation Number</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    id="matricNumber"
                    type="text"
                    placeholder="e.g. 2024/1/89402CE"
                    value={matricNumber}
                    onChange={(e) => setMatricNumber(e.target.value)}
                    required
                  />
                </div>
                <p className="form-help-text">Used for course submission identification & dual login.</p>
              </div>

              <div className="form-group animate-fade-in">
                <label htmlFor="admissionYear">Admission Year / Cohort Set</label>
                <div className="input-with-icon">
                  <Calendar size={18} className="input-icon" />
                  <select
                    id="admissionYear"
                    value={admissionYear}
                    onChange={(e) => setAdmissionYear(e.target.value)}
                    required
                  >
                    <option value="2021/2022">2021/2022 Set</option>
                    <option value="2022/2023">2022/2023 Set</option>
                    <option value="2023/2024">2023/2024 Set</option>
                    <option value="2024/2025">2024/2025 Set</option>
                    <option value="2025/2026">2025/2026 Set</option>
                    <option value="2026/2027">2026/2027 Set</option>
                  </select>
                </div>
                <p className="form-help-text">You will automatically receive assignments targeted to this cohort set.</p>
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary w-full auth-submit-btn" disabled={loading}>
            {loading ? (
              <span className="spinner"></span>
            ) : (
              <>
                <span>Register Account</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-card-divider">
          <div className="auth-footer">
            <p>
              Already have an account? <Link to="/login">Sign In Instead</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import LecturerDashboard from './pages/LecturerDashboard';
import StudentDashboard from './pages/StudentDashboard';

// Protected Route wrapper component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '20px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderTopColor: 'var(--primary)' }}></div>
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-title)' }}>Loading secure session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Route director depending on user role
const DashboardDirector = () => {
  const { user } = useAuth();
  
  if (user.role === 'lecturer') {
    return <LecturerDashboard />;
  } else {
    return <StudentDashboard />;
  }
};

function App() {
  return (
    <div className="app-root">
      <div className="app-content">
        <Router>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <DashboardDirector />
                  </ProtectedRoute>
                } 
              />
              
              {/* Catch all redirects to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AuthProvider>
        </Router>
      </div>
      <footer className="app-footer">
        © 2026 <span>IT Defence Project</span>, All Rights Reserved.
      </footer>
    </div>
  );
}

export default App;

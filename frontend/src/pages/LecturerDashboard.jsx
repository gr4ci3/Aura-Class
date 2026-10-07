import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, Send, BookOpen, Clock, Users, CheckCircle2, 
  AlertCircle, ExternalLink, Calendar, ClipboardList, PlusCircle, BarChart3,
  Award, EyeOff, Sparkles, Activity, FileText, Download, Paperclip
} from 'lucide-react';
import logo from '../assets/logo.png';
import SubmissionsDrawer from '../components/SubmissionsDrawer';
import DocumentUploader from '../components/DocumentUploader';
import './Dashboard.css';

const LecturerDashboard = () => {
  const { user, logout, authenticatedFetch } = useAuth();
  
  // Create assignment form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState(user?.department || 'Computer Engineering');
  const [academicYear, setAcademicYear] = useState('2024/2025');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('23:59');
  const [uploadedFile, setUploadedFile] = useState(null); // { url, originalName, sizeFormatted }
  
  // Sent assignments state
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [emailPreviewUrl, setEmailPreviewUrl] = useState(null);

  // Submissions drawer state
  const [activeSubmissionsAssignment, setActiveSubmissionsAssignment] = useState(null);

  // Fetch lecturer's sent assignments
  const fetchAssignments = async () => {
    try {
      const data = await authenticatedFetch('/assignments/lecturer');
      setAssignments(data.assignments);
    } catch (err) {
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!title || !description || !department || !academicYear || !dueDate || !dueTime) {
      setErrorMsg('Please fill in all assignment details.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    setEmailPreviewUrl(null);

    // Combine due date and time
    const parsedDueDate = new Date(`${dueDate}T${dueTime}`);

    const payload = {
      title,
      description,
      department,
      academicYear,
      dueDate: parsedDueDate.toISOString(),
      attachmentUrl: uploadedFile?.url || null,
      attachmentName: uploadedFile?.originalName || null,
      attachmentSize: uploadedFile?.sizeFormatted || null
    };

    try {
      const data = await authenticatedFetch('/assignments', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setSuccessMsg(`Assignment published successfully! Distributed to ${data.recipientsCount} students.`);
      if (data.emailPreviewUrl) {
        setEmailPreviewUrl(data.emailPreviewUrl);
      }

      // Reset form
      setTitle('');
      setDescription('');
      setUploadedFile(null);
      
      // Refresh assignments list
      fetchAssignments();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to publish assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-container animate-fade-in">
      {/* Header bar */}
      <header className="dashboard-header glass-panel">
        <div className="header-brand">
          <img src={logo} alt="FUT Minna Logo" className="header-logo-img" />
          <h1>Aura<span>Class</span> <span className="role-tag">Lecturer</span></h1>
        </div>
        
        <div className="user-profile-widget">
          <div className="user-details">
            <span className="user-name">{user?.name}</span>
            <span className="user-info">{user?.department} Department</span>
          </div>
          <button onClick={logout} className="btn-logout" title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main dashboard body */}
      <main className="dashboard-grid">
        {/* Create Assignment panel */}
        <section className="dashboard-sidebar glass-panel">
          <div className="section-title">
            <PlusCircle size={20} className="title-icon" />
            <h2>Create Assignment</h2>
          </div>

          {errorMsg && (
            <div className="feedback-message error-message">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="feedback-message success-message">
              <CheckCircle2 size={16} />
              <div>
                <p>{successMsg}</p>
                {emailPreviewUrl && (
                  <a 
                    href={emailPreviewUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="email-preview-link"
                  >
                    View Sent Notification Emails <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handlePublish} className="assignment-form">
            <div className="form-group">
              <label htmlFor="title">Assignment Title</label>
              <input
                id="title"
                type="text"
                placeholder="e.g. Relational Database Normalization"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Instructions & Details</label>
              <textarea
                id="description"
                rows="4"
                placeholder="Write detailed guidelines for the assignment here..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              ></textarea>
            </div>

            {/* Document Upload for Lecturer Assignment Material */}
            <div className="form-group">
              <DocumentUploader
                label="Attach Assignment File / PDF (Optional, Max 10MB)"
                initialFile={uploadedFile}
                onFileUploaded={(file) => setUploadedFile(file)}
                onFileRemoved={() => setUploadedFile(null)}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="target-dept">Target Department</label>
                <select
                  id="target-dept"
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

              <div className="form-group">
                <label htmlFor="target-year">Target Cohort Set</label>
                <select
                  id="target-year"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
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
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="due-date">Due Date</label>
                <input
                  id="due-date"
                  type="date"
                  value={dueDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="due-time">Due Time</label>
                <input
                  id="due-time"
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
              {submitting ? (
                <span className="spinner"></span>
              ) : (
                <>
                  <Send size={16} /> Publish & Notify Students
                </>
              )}
            </button>
          </form>
        </section>

        {/* Sent Assignments list */}
        <section className="dashboard-main glass-panel">
          <div className="section-title">
            <ClipboardList size={20} className="title-icon" />
            <h2>Sent Assignments History</h2>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner" style={{ width: '30px', height: '30px', borderTopColor: 'var(--primary)' }}></div>
              <p>Fetching assignments...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={48} className="empty-icon" />
              <h3>No assignments created yet</h3>
              <p>Use the creation panel on the left to write and publish your first class assignment.</p>
            </div>
          ) : (
            <div className="assignments-list">
              {assignments.map((assignment) => {
                const isOverdue = new Date(assignment.dueDate) < new Date();
                const completionPercentage = assignment.stats.total > 0
                  ? Math.round((assignment.stats.completed / assignment.stats.total) * 100)
                  : 0;

                return (
                  <div key={assignment.id} className="assignment-card">
                    <div className="card-header">
                      <div>
                        <h3>{assignment.title}</h3>
                        <div className="cohort-badge">
                          <Users size={12} />
                          <span>{assignment.department} • {assignment.academicYear} Set</span>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {assignment.isGradesFinalized && (
                          <span className="badge-graded" style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem' }}>
                            Grades Finalised
                          </span>
                        )}
                        <span className={`status-badge ${isOverdue ? 'badge-danger' : 'badge-success'}`}>
                          {isOverdue ? 'Overdue' : 'Active'}
                        </span>
                      </div>
                    </div>

                    <p className="card-description">{assignment.description}</p>

                    {/* Attached Lecturer Document if available */}
                    {assignment.attachmentUrl && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#fbf8f3',
                        border: '1.5px solid #ded2be',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <Paperclip size={16} color="#3b0764" />
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2e1065', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {assignment.attachmentName || 'Assignment Brief Attachment'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#736787' }}>({assignment.attachmentSize || 'Document'})</span>
                        </div>

                        <a
                          href={assignment.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '4px' }}
                        >
                          <Download size={14} /> Download
                        </a>
                      </div>
                    )}

                    <div className="card-footer">
                      <div className="footer-info">
                        <Calendar size={14} />
                        <span>Created: {new Date(assignment.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="footer-info">
                        <Clock size={14} />
                        <span className={isOverdue ? 'text-danger' : ''}>
                          Due: {new Date(assignment.dueDate).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Analytics Progress Bar */}
                    <div className="card-analytics">
                      <div className="analytics-header">
                        <span className="analytics-title">
                          <BarChart3 size={14} /> Completion & Grading Status
                        </span>
                        <span className="analytics-score">
                          <strong>{assignment.stats.completed}</strong> of <strong>{assignment.stats.total}</strong> submitted • <strong>{assignment.stats.graded || 0}</strong> graded
                        </span>
                      </div>
                      <div className="progress-bar-bg">
                        <div 
                          className="progress-bar-fill" 
                          style={{ width: `${completionPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Review Submissions & Blind Grading Action */}
                    <div style={{ marginTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setActiveSubmissionsAssignment(assignment)}
                        className="btn btn-primary w-full"
                        style={{ padding: '11px', display: 'flex', gap: '8px', justifyContent: 'center' }}
                      >
                        <EyeOff size={16} /> Review Submissions & Blind Grading (Timeline Inspector)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Submissions & Blind Grading Drawer Modal */}
      {activeSubmissionsAssignment && (
        <SubmissionsDrawer
          assignment={activeSubmissionsAssignment}
          onClose={() => setActiveSubmissionsAssignment(null)}
          authenticatedFetch={authenticatedFetch}
          onRefreshAssignments={fetchAssignments}
        />
      )}
    </div>
  );
};

export default LecturerDashboard;

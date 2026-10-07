import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, BookOpen, Clock, CheckCircle2, Circle, 
  AlertCircle, Calendar, User, ClipboardList, CheckSquare, Award,
  Edit3, FileText, Sparkles, ShieldAlert, Paperclip, Download
} from 'lucide-react';
import logo from '../assets/logo.png';
import WritingEditor from '../components/WritingEditor';
import './Dashboard.css';

const StudentDashboard = () => {
  const { user, logout, authenticatedFetch } = useAuth();
  
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'completed'

  // Document writing editor modal state
  const [activeWritingAssignment, setActiveWritingAssignment] = useState(null);

  const fetchAssignments = async () => {
    try {
      const data = await authenticatedFetch('/assignments/student');
      setAssignments(data.assignments);
    } catch (err) {
      console.error('Error fetching student assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleStatusToggle = async (assignmentId, currentStatus) => {
    setUpdatingId(assignmentId);
    const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';

    try {
      await authenticatedFetch(`/assignments/${assignmentId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      
      setAssignments(prev => 
        prev.map(a => a.id === assignmentId ? { ...a, status: newStatus, updatedAt: new Date().toISOString() } : a)
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveSubmission = async (content, telemetry, attachment) => {
    if (!activeWritingAssignment) return;

    await authenticatedFetch(`/assignments/${activeWritingAssignment.id}/submit`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        telemetry,
        attachmentUrl: attachment?.url || null,
        attachmentName: attachment?.name || null,
        attachmentSize: attachment?.size || null
      })
    });

    fetchAssignments();
  };

  // Calculate stats
  const totalCount = assignments.length;
  const completedCount = assignments.filter(a => a.status === 'completed').length;
  const pendingCount = totalCount - completedCount;
  
  const overdueCount = assignments.filter(a => {
    const isOverdue = new Date(a.dueDate) < new Date();
    return isOverdue && a.status === 'pending';
  }).length;

  const scorePercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filter list
  const filteredAssignments = assignments.filter(a => {
    if (filterStatus === 'pending') return a.status === 'pending';
    if (filterStatus === 'completed') return a.status === 'completed';
    return true;
  });

  return (
    <div className="dashboard-container animate-fade-in">
      {/* Header bar */}
      <header className="dashboard-header glass-panel">
        <div className="header-brand">
          <img src={logo} alt="FUT Minna Logo" className="header-logo-img" />
          <h1>Aura<span>Class</span> <span className="role-tag student-tag">Student</span></h1>
        </div>
        
        <div className="user-profile-widget">
          <div className="user-details">
            <span className="user-name">{user?.name}</span>
            <span className="user-info">{user?.department} • {user?.admissionYear} Cohort</span>
            {user?.matricNumber && (
              <span className="matric-pill">Matric: {user.matricNumber}</span>
            )}
          </div>
          <button onClick={logout} className="btn-logout" title="Sign Out">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Analytics Summary Banner */}
      <section className="stats-strip glass-panel">
        <div className="stat-card">
          <div className="stat-icon-wrapper purple-glow">
            <ClipboardList size={22} color="#3b0764" />
          </div>
          <div className="stat-details">
            <span className="stat-num">{totalCount}</span>
            <span className="stat-label">Total Assigned</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper green-glow">
            <CheckSquare size={22} className="text-success" />
          </div>
          <div className="stat-details">
            <span className="stat-num">{completedCount}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper beige-glow">
            <Clock size={22} color="#b45309" />
          </div>
          <div className="stat-details">
            <span className="stat-num">{pendingCount}</span>
            <span className="stat-label">Pending Task{pendingCount !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper red-glow">
            <AlertCircle size={22} className="text-danger" />
          </div>
          <div className="stat-details">
            <span className="stat-num">{overdueCount}</span>
            <span className="stat-label">Overdue Tasks</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper purple-glow">
            <Award size={22} color="#4c1d95" />
          </div>
          <div className="stat-details">
            <span className="stat-num">{scorePercentage}%</span>
            <span className="stat-label">Completion Score</span>
          </div>
        </div>
      </section>

      {/* Main dashboard body */}
      <main className="dashboard-grid student-grid">
        <section className="dashboard-main glass-panel">
          <div className="dashboard-main-header">
            <div className="section-title">
              <BookOpen size={20} className="title-icon" />
              <h2>Assignments Cohort Inbox</h2>
            </div>
            
            {/* Filter Tabs */}
            <div className="filter-tabs">
              <button 
                className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                All
              </button>
              <button 
                className={`filter-tab ${filterStatus === 'pending' ? 'active' : ''}`}
                onClick={() => setFilterStatus('pending')}
              >
                Pending
              </button>
              <button 
                className={`filter-tab ${filterStatus === 'completed' ? 'active' : ''}`}
                onClick={() => setFilterStatus('completed')}
              >
                Completed
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner" style={{ width: '30px', height: '30px', borderTopColor: 'var(--primary)' }}></div>
              <p>Fetching assignments...</p>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="empty-state">
              <BookOpen size={48} className="empty-icon" />
              <h3>No assignments found</h3>
              <p>
                {filterStatus === 'all' 
                  ? "There are no assignments posted for your cohort set yet."
                  : filterStatus === 'pending' 
                  ? "You have cleared all pending assignments! Good job."
                  : "You have not completed any assignments yet."}
              </p>
            </div>
          ) : (
            <div className="assignments-list">
              {filteredAssignments.map((assignment) => {
                const isCompleted = assignment.status === 'completed';
                const isOverdue = new Date(assignment.dueDate) < new Date() && !isCompleted;
                const hasSubmission = Boolean(assignment.submissionContent) || Boolean(assignment.submissionAttachmentUrl);
                const isGraded = assignment.isGraded && assignment.isGradesFinalized;

                return (
                  <div key={assignment.id} className={`assignment-card student-card ${isCompleted ? 'card-completed' : ''}`}>
                    <div className="card-header">
                      <div>
                        <h3>{assignment.title}</h3>
                        <div className="lecturer-badge">
                          <User size={12} />
                          <span>Lecturer: {assignment.lecturerName}</span>
                        </div>
                      </div>

                      <div className="badges-wrapper" style={{ display: 'flex', gap: '8px' }}>
                        {isGraded && (
                          <span className="badge-graded" style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '0.78rem' }}>
                            Grade: {assignment.grade}
                          </span>
                        )}
                        {isOverdue && <span className="status-badge badge-danger">Overdue</span>}
                        <span className={`status-badge ${isCompleted ? 'badge-success' : 'badge-pending'}`}>
                          {isCompleted ? 'Submitted / Completed' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    <p className="card-description">{assignment.description}</p>

                    {/* Lecturer Attached Document (Project Brief) */}
                    {assignment.attachmentUrl && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#f5efe6',
                        border: '1.5px solid #ded2be',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <Paperclip size={16} color="#3b0764" />
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2e1065', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            Lecturer Attachment: {assignment.attachmentName || 'Assignment Brief'}
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
                          <Download size={14} /> Download File
                        </a>
                      </div>
                    )}

                    {/* Student's Own Submitted Attachment */}
                    {assignment.submissionAttachmentUrl && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#f0fdf4',
                        border: '1.5px solid #a7f3d0',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <CheckCircle2 size={16} color="#059669" />
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#065f46', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            Your Submitted File: {assignment.submissionAttachmentName || 'Attached Document'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#047857' }}>({assignment.submissionAttachmentSize || 'Document'})</span>
                        </div>

                        <a
                          href={assignment.submissionAttachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '4px', borderColor: '#a7f3d0' }}
                        >
                          <Download size={14} /> View File
                        </a>
                      </div>
                    )}

                    {/* Graded Feedback Box if available and finalized */}
                    {isGraded && assignment.feedback && (
                      <div className="grade-feedback-box">
                        <div className="grade-feedback-title">
                          <span>🎓 Lecturer Remarks & Evaluation:</span>
                          <span className="grade-badge-lg">{assignment.grade}</span>
                        </div>
                        <p className="grade-feedback-text">{assignment.feedback}</p>
                      </div>
                    )}

                    <div className="card-footer">
                      <div className="footer-info">
                        <Calendar size={14} />
                        <span>Posted: {new Date(assignment.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="footer-info">
                        <Clock size={14} />
                        <span className={isOverdue ? 'text-danger' : ''}>
                          Due: {new Date(assignment.dueDate).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Document Workspace & Status Control Actions */}
                    <div className="card-actions" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setActiveWritingAssignment(assignment)}
                        className="btn btn-primary"
                        style={{ padding: '10px' }}
                      >
                        <Edit3 size={16} /> {hasSubmission ? 'View / Edit Submission' : '✍️ Open Document Workspace'}
                      </button>

                      <button
                        className={`btn btn-status-toggle ${isCompleted ? 'btn-secondary' : 'btn-beige'}`}
                        disabled={updatingId === assignment.id}
                        onClick={() => handleStatusToggle(assignment.id, assignment.status)}
                      >
                        {updatingId === assignment.id ? (
                          <span className="spinner"></span>
                        ) : isCompleted ? (
                          <>
                            <Circle size={16} /> Mark as Pending (Undo)
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={16} /> Mark as Completed
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Embedded Document Writing Workspace Modal */}
      {activeWritingAssignment && (
        <WritingEditor
          assignment={activeWritingAssignment}
          initialContent={activeWritingAssignment.submissionContent || ''}
          initialAttachment={activeWritingAssignment.submissionAttachmentUrl ? {
            url: activeWritingAssignment.submissionAttachmentUrl,
            originalName: activeWritingAssignment.submissionAttachmentName,
            sizeFormatted: activeWritingAssignment.submissionAttachmentSize
          } : null}
          initialTelemetry={activeWritingAssignment.telemetry}
          onClose={() => setActiveWritingAssignment(null)}
          onSubmitted={handleSaveSubmission}
        />
      )}
    </div>
  );
};

export default StudentDashboard;

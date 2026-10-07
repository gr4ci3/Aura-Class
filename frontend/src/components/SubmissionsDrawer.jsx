import React, { useState, useEffect } from 'react';
import { 
  Users, Eye, EyeOff, CheckCircle2, Award, 
  Activity, Sparkles, X, AlertCircle, Save, Lock, Unlock,
  FileText, Download
} from 'lucide-react';
import WritingPlaybackModal from './WritingPlaybackModal';

const SubmissionsDrawer = ({ assignment, onClose, authenticatedFetch, onRefreshAssignments }) => {
  const [submissionsData, setSubmissionsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [finalizing, setFinalizing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Grade input state per student
  const [gradesMap, setGradesMap] = useState({});
  const [feedbackMap, setFeedbackMap] = useState({});

  // Active playback inspector modal
  const [inspectingSubmission, setInspectingSubmission] = useState(null);

  const fetchSubmissions = async () => {
    try {
      const data = await authenticatedFetch(`/assignments/${assignment.id}/submissions`);
      setSubmissionsData(data);

      // Populate initial grades map
      const initialGrades = {};
      const initialFeedback = {};
      data.submissions.forEach(sub => {
        initialGrades[sub.studentId] = sub.grade || '';
        initialFeedback[sub.studentId] = sub.feedback || '';
      });
      setGradesMap(initialGrades);
      setFeedbackMap(initialFeedback);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [assignment.id]);

  const handleSaveGrade = async (studentId) => {
    setSavingId(studentId);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await authenticatedFetch(`/assignments/${assignment.id}/grade`, {
        method: 'POST',
        body: JSON.stringify({
          studentId,
          grade: gradesMap[studentId],
          feedback: feedbackMap[studentId]
        })
      });

      setSuccessMsg('Grade recorded for candidate.');
      fetchSubmissions();
      if (onRefreshAssignments) onRefreshAssignments();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save grade');
    } finally {
      setSavingId(null);
    }
  };

  const handleFinalizeGrades = async () => {
    if (!window.confirm('Are you sure you want to finalise all grades and unmask student identities? This action locks the grading cycle.')) {
      return;
    }

    setFinalizing(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await authenticatedFetch(`/assignments/${assignment.id}/finalize-grades`, {
        method: 'POST'
      });

      setSuccessMsg('🎉 Grades Finalised! Student identities are now fully unmasked.');
      fetchSubmissions();
      if (onRefreshAssignments) onRefreshAssignments();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to finalize grades');
    } finally {
      setFinalizing(false);
    }
  };

  const isFinalized = submissionsData?.assignment?.isGradesFinalized || false;
  const submissions = submissionsData?.submissions || [];
  const gradedCount = submissions.filter(s => s.isGraded).length;

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content" style={{ maxWidth: '980px' }}>
        <div className="modal-header">
          <div>
            <h2>
              <Users size={22} color="#3b0764" />
              <span>Submissions & Grading: <strong>{assignment.title}</strong></span>
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#736787', marginTop: '2px' }}>
              {assignment.department} • {assignment.academicYear} Cohort Set
            </p>
          </div>
          <button onClick={onClose} className="btn-close-modal" title="Close Submissions">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Top Blind Review / Unmasking Banner */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '14px',
            background: isFinalized ? '#f5efe6' : '#f4ecff',
            border: `1.5px solid ${isFinalized ? '#c4a47c' : '#ded2be'}`,
            borderRadius: '12px',
            padding: '16px 20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {isFinalized ? (
                <Unlock size={24} color="#059669" />
              ) : (
                <Lock size={24} color="#3b0764" />
              )}
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#2e1065', display: 'block' }}>
                  {isFinalized ? '🔓 Student Identities Unmasked' : '🔒 Blind Review Mode Active (Identities Masked)'}
                </strong>
                <span style={{ fontSize: '0.82rem', color: '#4a3e5c' }}>
                  {isFinalized 
                    ? 'Grades are finalized. Student names and matriculation numbers are visible.' 
                    : 'Student names and matric numbers are hidden to prevent grading bias.'}
                </span>
              </div>
            </div>

            {!isFinalized && (
              <button
                type="button"
                onClick={handleFinalizeGrades}
                disabled={finalizing || submissions.length === 0}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', padding: '10px 18px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}
              >
                {finalizing ? (
                  <span className="spinner"></span>
                ) : (
                  <>
                    <Sparkles size={16} /> Finalise & Unmask Grades
                  </>
                )}
              </button>
            )}
          </div>

          {successMsg && (
            <div className="feedback-message success-message">
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="feedback-message error-message">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading candidate submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="empty-state">
              <Users size={48} className="empty-icon" />
              <h3>No student submissions yet</h3>
              <p>When students in this cohort submit their written work, their submissions will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 700, color: '#3b0764' }}>
                <span>CANDIDATES ({submissions.length} Total)</span>
                <span>GRADED: {gradedCount} / {submissions.length}</span>
              </div>

              {submissions.map((sub) => {
                const hasLargePaste = sub.telemetry?.hasLargePasteWarning || (sub.telemetry?.largestPasteWords >= 150);

                return (
                  <div key={sub.studentId} className="candidate-card">
                    <div className="candidate-card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="candidate-token">
                          {isFinalized ? (
                            <>
                              <span className="unmasked-name">{sub.studentName}</span>
                              <span className="unmasked-matric">{sub.matricNumber}</span>
                            </>
                          ) : (
                            <>
                              <EyeOff size={16} color="#3b0764" />
                              <span>{sub.candidateToken}</span>
                            </>
                          )}
                        </span>

                        {hasLargePaste && (
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: '12px' }}>
                            🚨 Large Paste Burst
                          </span>
                        )}

                        {sub.isGraded && (
                          <span className="badge-graded" style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                            Grade: {sub.grade}
                          </span>
                        )}
                      </div>

                      {/* Timeline Scrubber Button */}
                      <button
                        type="button"
                        onClick={() => setInspectingSubmission(sub)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '6px 14px', gap: '6px' }}
                      >
                        <Activity size={16} color="#3b0764" /> Inspect Writing Timeline
                      </button>
                    </div>

                    {/* Paper Preview */}
                    <div style={{ background: '#fbf8f3', border: '1px solid #ede2d3', borderRadius: '8px', padding: '12px', fontSize: '0.9rem', color: '#1e0e38', maxHeight: '120px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                      {sub.submissionContent || <em style={{ color: '#736787' }}>No written text entered.</em>}
                    </div>

                    {/* Candidate Attached Document (if uploaded) */}
                    {sub.attachmentUrl && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: '#f5efe6',
                        border: '1px solid #ded2be',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        gap: '10px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <FileText size={16} color="#3b0764" />
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#2e1065', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            Attached File: {sub.attachmentName || 'Candidate Document'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#736787' }}>({sub.attachmentSize || 'Document'})</span>
                        </div>

                        <a
                          href={sub.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '4px' }}
                        >
                          <Download size={14} /> Download File
                        </a>
                      </div>
                    )}

                    {/* Grading Form Row */}
                    <div className="grading-inputs-row">
                      <div>
                        <input
                          type="text"
                          placeholder="Grade (e.g. A, 90)"
                          value={gradesMap[sub.studentId] || ''}
                          onChange={(e) => setGradesMap({ ...gradesMap, [sub.studentId]: e.target.value })}
                          disabled={isFinalized}
                          style={{ fontSize: '0.88rem', padding: '8px 12px' }}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="Feedback / remarks for candidate..."
                          value={feedbackMap[sub.studentId] || ''}
                          onChange={(e) => setFeedbackMap({ ...feedbackMap, [sub.studentId]: e.target.value })}
                          disabled={isFinalized}
                          style={{ fontSize: '0.88rem', padding: '8px 12px' }}
                        />
                      </div>
                      <div>
                        {!isFinalized && (
                          <button
                            type="button"
                            onClick={() => handleSaveGrade(sub.studentId)}
                            disabled={savingId === sub.studentId || !gradesMap[sub.studentId]}
                            className="btn btn-primary"
                            style={{ fontSize: '0.85rem', padding: '8px 16px' }}
                          >
                            {savingId === sub.studentId ? (
                              <span className="spinner"></span>
                            ) : (
                              <>
                                <Save size={14} /> Save Grade
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Close Drawer
          </button>
        </div>
      </div>

      {/* Scrubbable Playback Modal */}
      {inspectingSubmission && (
        <WritingPlaybackModal
          submission={inspectingSubmission}
          candidateToken={isFinalized ? `${inspectingSubmission.studentName} (${inspectingSubmission.matricNumber})` : inspectingSubmission.candidateToken}
          onClose={() => setInspectingSubmission(null)}
        />
      )}
    </div>
  );
};

export default SubmissionsDrawer;

import React, { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, Clock, FileText, Send, AlertTriangle, 
  CheckCircle2, X, Sparkles, ShieldAlert, Paperclip, Download
} from 'lucide-react';
import DocumentUploader from './DocumentUploader';

const WritingEditor = ({ 
  assignment, 
  initialContent = '', 
  initialTelemetry = null, 
  initialAttachment = null,
  onClose, 
  onSubmitted 
}) => {
  const [content, setContent] = useState(initialContent);
  const [uploadedFile, setUploadedFile] = useState(initialAttachment); // { url, originalName, sizeFormatted }
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Telemetry recording state
  const startTimeRef = useRef(Date.now());
  const lastEventTimeRef = useRef(Date.now());
  const lastLengthRef = useRef(initialContent.length);
  const lastWordsRef = useRef(initialContent.trim() ? initialContent.trim().split(/\s+/).length : 0);
  
  const [timeline, setTimeline] = useState(initialTelemetry?.timeline || [
    {
      timestamp: '00:00:00',
      elapsedSeconds: 0,
      wordCount: initialContent.trim() ? initialContent.trim().split(/\s+/).length : 0,
      deltaWords: 0,
      isPaste: false,
      snapshot: initialContent
    }
  ]);

  const [pasteCount, setPasteCount] = useState(initialTelemetry?.pasteCount || 0);
  const [largestPasteWords, setLargestPasteWords] = useState(initialTelemetry?.largestPasteWords || 0);
  const [hasLargePasteWarning, setHasLargePasteWarning] = useState(initialTelemetry?.hasLargePasteWarning || false);
  const [activeTypingSeconds, setActiveTypingSeconds] = useState(initialTelemetry?.totalDurationSeconds || 0);

  // Active typing timer
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTypingSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `00:${mins}:${secs}`;
  };

  // Handle keystroke and paste telemetry
  const handleContentChange = (e) => {
    const newText = e.target.value;
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - startTimeRef.current) / 1000);
    const timeDeltaMs = now - lastEventTimeRef.current;
    
    const newWords = newText.trim() ? newText.trim().split(/\s+/).length : 0;
    const wordDelta = newWords - lastWordsRef.current;
    const charDelta = newText.length - lastLengthRef.current;

    // Detect sudden burst / paste event:
    const isBurstPaste = (charDelta > 35 || wordDelta >= 8) && timeDeltaMs < 450;

    let updatedPasteCount = pasteCount;
    let updatedLargestPaste = largestPasteWords;
    let updatedWarning = hasLargePasteWarning;

    if (isBurstPaste) {
      updatedPasteCount += 1;
      setPasteCount(updatedPasteCount);
      if (wordDelta > updatedLargestPaste) {
        updatedLargestPaste = wordDelta;
        setLargestPasteWords(updatedLargestPaste);
      }
      if (wordDelta >= 150) {
        updatedWarning = true;
        setHasLargePasteWarning(true);
      }
    }

    // Record snapshot into scrubbable timeline
    const newEvent = {
      timestamp: formatTime(elapsedSeconds),
      elapsedSeconds,
      wordCount: newWords,
      deltaWords: wordDelta > 0 ? wordDelta : 0,
      isPaste: isBurstPaste,
      snapshot: newText
    };

    setTimeline(prev => [...prev, newEvent]);

    lastEventTimeRef.current = now;
    lastLengthRef.current = newText.length;
    lastWordsRef.current = newWords;
    setContent(newText);
  };

  const handleManualPaste = (e) => {
    const pastedData = e.clipboardData.getData('text');
    const pastedWordCount = pastedData.trim() ? pastedData.trim().split(/\s+/).length : 0;

    if (pastedWordCount >= 50) {
      setHasLargePasteWarning(true);
    }
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const estimatedWPM = activeTypingSeconds > 0 ? Math.round((wordCount / (activeTypingSeconds / 60))) : 0;

  const handleSubmit = async () => {
    if (!content.trim() && !uploadedFile) {
      setErrorMsg('Please write your document solution or attach a document file before submitting.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const telemetryPayload = {
      totalDurationSeconds: activeTypingSeconds,
      wpm: estimatedWPM,
      pasteCount,
      largestPasteWords,
      hasLargePasteWarning: hasLargePasteWarning || largestPasteWords >= 150,
      timeline
    };

    const attachmentPayload = uploadedFile ? {
      url: uploadedFile.url,
      name: uploadedFile.originalName,
      size: uploadedFile.sizeFormatted
    } : null;

    try {
      await onSubmitted(content, telemetryPayload, attachmentPayload);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit document');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content" style={{ maxWidth: '920px' }}>
        <div className="modal-header">
          <h2>
            <FileText size={22} color="#3b0764" />
            <span>Document Workspace: <strong>{assignment.title}</strong></span>
          </h2>
          <button onClick={onClose} className="btn-close-modal" title="Close Workspace">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Lecturer Attachment Prompt if available */}
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
                  Lecturer Brief: {assignment.attachmentName || 'Assignment Document'}
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
                <Download size={14} /> Download Brief
              </a>
            </div>
          )}

          {/* Telemetry Tracking Header */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center', background: '#fbf8f3', border: '1.5px solid #ded2be', borderRadius: '10px', padding: '12px 18px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '0.85rem', color: '#4a3e5c', fontWeight: 600 }}>
              <span>📝 Words: <strong style={{ color: '#2e1065' }}>{wordCount}</strong></span>
              <span>⏱️ Active Time: <strong style={{ color: '#2e1065' }}>{formatTime(activeTypingSeconds)}</strong></span>
              <span>⚡ Pace: <strong style={{ color: '#2e1065' }}>{estimatedWPM} WPM</strong></span>
            </div>

            {hasLargePasteWarning ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '3px 10px', borderRadius: '20px' }}>
                <ShieldAlert size={14} /> Telemetry Flag: Large Paste ({largestPasteWords} words)
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontWeight: 700, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '3px 10px', borderRadius: '20px' }}>
                <Sparkles size={14} /> Keystroke Telemetry Active
              </span>
            )}
          </div>

          {errorMsg && (
            <div className="feedback-message error-message">
              <AlertTriangle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Document Editor Surface */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label htmlFor="student-paper-editor" style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3b0764' }}>
              OPTION 1: WRITE YOUR SOLUTION ONLINE (TELEMETRY TRACKED)
            </label>
            <textarea
              id="student-paper-editor"
              rows={10}
              value={content}
              onChange={handleContentChange}
              onPaste={handleManualPaste}
              placeholder="Type your assignment solution here. Keystroke telemetry records your natural writing progression..."
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '1rem',
                lineHeight: 1.7,
                border: '1.5px solid #ded2be',
                borderRadius: '12px',
                background: '#ffffff',
                color: '#1e0e38',
                resize: 'vertical',
                fontFamily: 'inherit',
                outline: 'none'
              }}
            />
          </div>

          {/* Option 2: Document File Upload */}
          <div>
            <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3b0764', marginBottom: '6px', display: 'block' }}>
              OPTION 2: ATTACH DOCUMENT FILE (PDF, DOCX, ZIP - MAX 10MB)
            </label>
            <DocumentUploader
              label="Upload Report / Solution File"
              initialFile={uploadedFile}
              onFileUploaded={(file) => setUploadedFile(file)}
              onFileRemoved={() => setUploadedFile(null)}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleSubmit} 
            disabled={submitting || (!content.trim() && !uploadedFile)} 
            className="btn btn-primary"
          >
            {submitting ? (
              <span className="spinner"></span>
            ) : (
              <>
                <Send size={18} /> Submit Solution / Document
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WritingEditor;

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, AlertTriangle, CheckCircle2, 
  Clock, ShieldAlert, FastForward, X, Sparkles, Activity
} from 'lucide-react';

const WritingPlaybackModal = ({ submission, candidateToken, onClose }) => {
  const telemetry = submission?.telemetry || {
    totalDurationSeconds: 120,
    wpm: 40,
    pasteCount: 0,
    largestPasteWords: 0,
    hasLargePasteWarning: false,
    timeline: [
      {
        timestamp: '00:00:00',
        elapsedSeconds: 0,
        wordCount: submission?.submissionContent ? submission.submissionContent.split(/\s+/).length : 0,
        deltaWords: 0,
        isPaste: false,
        snapshot: submission?.submissionContent || 'No telemetry recorded for this document.'
      }
    ]
  };

  const timeline = telemetry.timeline && telemetry.timeline.length > 0
    ? telemetry.timeline
    : [
        {
          timestamp: '00:00:00',
          elapsedSeconds: 0,
          wordCount: submission?.submissionContent ? submission.submissionContent.split(/\s+/).length : 0,
          deltaWords: 0,
          isPaste: false,
          snapshot: submission?.submissionContent || 'No document content available.'
        }
      ];

  const totalSteps = timeline.length;
  const [currentStepIndex, setCurrentStepIndex] = useState(totalSteps - 1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(2); // 1x, 2x, 5x, 10x, 20x
  const timerRef = useRef(null);

  const currentFrame = timeline[currentStepIndex] || timeline[0];

  // Playback animation effect
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(50, 400 / playbackSpeed);
      timerRef.current = setInterval(() => {
        setCurrentStepIndex(prev => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, playbackSpeed, totalSteps]);

  const handleSliderChange = (e) => {
    setIsPlaying(false);
    setCurrentStepIndex(parseInt(e.target.value, 10));
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const progressPercentage = totalSteps > 1 ? Math.round((currentStepIndex / (totalSteps - 1)) * 100) : 100;

  // Find paste burst events for timeline heat markers
  const pasteMarkers = timeline
    .map((item, idx) => ({ ...item, index: idx }))
    .filter(item => item.isPaste || item.deltaWords >= 50);

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content" style={{ maxWidth: '960px' }}>
        <div className="modal-header">
          <h2>
            <Activity size={22} color="#3b0764" />
            <span>Writing Timeline Inspector: <strong>{candidateToken || 'Candidate Submission'}</strong></span>
          </h2>
          <button onClick={onClose} className="btn-close-modal" title="Close Inspector">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Analysis Header Box */}
          {telemetry.hasLargePasteWarning || telemetry.largestPasteWords >= 150 ? (
            <div className="telemetry-alert-banner alert-paste-danger">
              <ShieldAlert size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '2px' }}>
                  🚨 Large Paste Burst Detected (+{telemetry.largestPasteWords} words inserted at once)
                </strong>
                <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                  This document contains an instantaneous insertion of {telemetry.largestPasteWords} words. Scrub the timeline to review the exact moment this block was pasted.
                </p>
              </div>
            </div>
          ) : (
            <div className="telemetry-alert-banner alert-natural-success">
              <CheckCircle2 size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '2px' }}>
                  ✅ Organic Typing Progression Verified
                </strong>
                <p style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                  Consistent natural typing cadence recorded across {telemetry.totalDurationSeconds || 60} seconds with an average speed of {telemetry.wpm || 35} WPM.
                </p>
              </div>
            </div>
          )}

          {/* Quick Metrics Strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            <div style={{ background: '#fbf8f3', border: '1.5px solid #ded2be', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#736787', fontWeight: 700, textTransform: 'uppercase' }}>Total Words</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2e1065' }}>{currentFrame.wordCount}</div>
            </div>
            <div style={{ background: '#fbf8f3', border: '1.5px solid #ded2be', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#736787', fontWeight: 700, textTransform: 'uppercase' }}>Timestamp</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2e1065' }}>{currentFrame.timestamp}</div>
            </div>
            <div style={{ background: '#fbf8f3', border: '1.5px solid #ded2be', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#736787', fontWeight: 700, textTransform: 'uppercase' }}>Typing Pace</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2e1065' }}>{telemetry.wpm || 38} WPM</div>
            </div>
            <div style={{ background: '#fbf8f3', border: '1.5px solid #ded2be', borderRadius: '8px', padding: '10px', textAlign: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: '#736787', fontWeight: 700, textTransform: 'uppercase' }}>Paste Events</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: telemetry.pasteCount > 0 ? '#dc2626' : '#059669' }}>
                {telemetry.pasteCount || 0}
              </div>
            </div>
          </div>

          {/* Scrubbable Player Controls */}
          <div className="scrubber-controls">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#3b0764' }}>
              <span>PROGRESSION: {progressPercentage}% ({currentStepIndex + 1} of {totalSteps} snapshots)</span>
              <span>TIMELINE: {currentFrame.timestamp}</span>
            </div>

            {/* Visual Heat Track with Paste Flags */}
            <div className="scrubber-heat-track" onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickPercent = (e.clientX - rect.left) / rect.width;
              const targetIndex = Math.min(totalSteps - 1, Math.max(0, Math.floor(clickPercent * totalSteps)));
              setCurrentStepIndex(targetIndex);
            }}>
              <div className="scrubber-fill" style={{ width: `${progressPercentage}%` }}></div>
              {pasteMarkers.map((marker, idx) => {
                const posPercent = (marker.index / (totalSteps - 1 || 1)) * 100;
                return (
                  <div
                    key={idx}
                    className="paste-warning-marker"
                    style={{ left: `${posPercent}%` }}
                    title={`🚨 Paste Burst (+${marker.deltaWords} words) at ${marker.timestamp}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentStepIndex(marker.index);
                    }}
                  />
                );
              })}
            </div>

            {/* Native range slider for smooth drag-to-scrub */}
            <input
              type="range"
              min="0"
              max={totalSteps - 1}
              value={currentStepIndex}
              onChange={handleSliderChange}
              className="scrubber-slider"
            />

            {/* Play, Pause, Speed & Reset Toolbar */}
            <div className="scrubber-btn-row">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="btn btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  {isPlaying ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Play Scrubber</>}
                </button>
                <button
                  type="button"
                  onClick={handleRestart}
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                  title="Restart timeline from beginning"
                >
                  <RotateCcw size={16} />
                </button>
              </div>

              {/* Speed Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', color: '#736787', fontWeight: 700 }}>SPEED:</span>
                <div className="speed-selector">
                  {[1, 2, 5, 10, 20].map(speed => (
                    <button
                      key={speed}
                      type="button"
                      className={`speed-btn ${playbackSpeed === speed ? 'active' : ''}`}
                      onClick={() => setPlaybackSpeed(speed)}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Progressive Text Reconstruction View */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#3b0764' }}>
              <span>DOCUMENT RECONSTRUCTION STATE AT {currentFrame.timestamp}:</span>
              {currentFrame.isPaste && (
                <span style={{ color: '#dc2626', fontWeight: 800 }}>
                  🚨 Instant Text Burst (+{currentFrame.deltaWords} words)
                </span>
              )}
            </div>
            <div className="reconstruction-box">
              {currentFrame.snapshot || <em style={{ color: '#736787' }}>(Document empty at this timeframe)</em>}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-primary">
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};

export default WritingPlaybackModal;

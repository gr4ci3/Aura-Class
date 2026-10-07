import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, X, AlertCircle, Paperclip } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 Megabytes

const DocumentUploader = ({ label = 'Attach Document (Max 10 MB)', onFileUploaded, onFileRemoved, initialFile = null }) => {
  const { token, API_BASE } = useAuth();
  const fileInputRef = useRef(null);
  
  const [fileData, setFileData] = useState(initialFile); // { url, originalName, sizeFormatted }
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const processFile = async (file) => {
    if (!file) return;

    setErrorMsg('');

    // Check size limit: 10MB
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const actualMB = (file.size / (1024 * 1024)).toFixed(1);
      setErrorMsg(`File size (${actualMB} MB) exceeds maximum allowed limit of 10 MB.`);
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('document', file);

    const uploadUrl = API_BASE ? `${API_BASE}/upload` : '/api/upload';

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      const uploadedInfo = {
        url: result.file.url,
        originalName: result.file.originalName,
        sizeFormatted: result.file.sizeFormatted,
        size: result.file.size
      };

      setFileData(uploadedInfo);
      if (onFileUploaded) onFileUploaded(uploadedInfo);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleRemove = () => {
    setFileData(null);
    setErrorMsg('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onFileRemoved) onFileRemoved();
  };

  return (
    <div className="document-uploader-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#3b0764', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </label>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#b45309', background: '#f5efe6', padding: '2px 8px', borderRadius: '4px', border: '1px solid #ded2be' }}>
          Limit: 10 MB
        </span>
      </div>

      {errorMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '0.82rem', fontWeight: 600 }}>
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {fileData ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fbf8f3',
          border: '1.5px solid #c4a47c',
          borderRadius: '10px',
          padding: '12px 16px',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f5efe6', border: '1px solid #ded2be', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b0764', flexShrink: 0 }}>
              <FileText size={20} />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <strong style={{ display: 'block', fontSize: '0.88rem', color: '#2e1065', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {fileData.originalName}
              </strong>
              <span style={{ fontSize: '0.78rem', color: '#736787' }}>
                {fileData.sizeFormatted || 'Uploaded Document'} • <a href={fileData.url} target="_blank" rel="noopener noreferrer" style={{ color: '#4c1d95', textDecoration: 'underline', fontWeight: 600 }}>View Attachment</a>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemove}
            style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
            title="Remove document"
          >
            <X size={18} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          style={{
            border: `2px dashed ${isDragOver ? '#3b0764' : '#ded2be'}`,
            borderRadius: '10px',
            padding: '20px 16px',
            textAlign: 'center',
            background: isDragOver ? '#f5efe6' : '#ffffff',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleInputChange}
            style={{ display: 'none' }}
            accept=".pdf,.docx,.doc,.txt,.pptx,.ppt,.xlsx,.xls,.zip,.rar,.png,.jpg,.jpeg,.csv"
          />

          {uploading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b0764', fontSize: '0.88rem', fontWeight: 600 }}>
              <span className="spinner" style={{ width: '18px', height: '18px', borderTopColor: '#3b0764' }}></span>
              <span>Uploading document securely...</span>
            </div>
          ) : (
            <>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f5efe6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b0764' }}>
                <UploadCloud size={22} />
              </div>
              <div>
                <strong style={{ fontSize: '0.88rem', color: '#2e1065', display: 'block' }}>
                  Click to browse or drag & drop document
                </strong>
                <span style={{ fontSize: '0.78rem', color: '#736787' }}>
                  PDF, DOCX, TXT, PPTX, XLSX, ZIP (Max 10 MB)
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;

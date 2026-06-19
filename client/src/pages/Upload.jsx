import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadNote, addTextNote } from '../services/api';

export default function Upload() {
  const [mode, setMode] = useState('file'); // 'file' or 'text'
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState(null);
  const fileRef = useRef();
  const navigate = useNavigate();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (f) { setFile(f); setTitle(f.name.replace(/\.[^.]+$/, '')); }
  };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setTitle(f.name.replace(/\.[^.]+$/, '')); }
  };

  const handleUpload = async () => {
    if (mode === 'file' && !file) return showToast('Please select a file', 'error');
    if (mode === 'text' && (!title || !textContent)) return showToast('Title and content are required', 'error');

    setLoading(true);
    try {
      if (mode === 'file') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        await uploadNote(formData);
      } else {
        await addTextNote({ title, content: textContent });
      }
      showToast('Note saved successfully!');
      setTimeout(() => navigate('/'), 1500);
    } catch (err) {
      showToast(err.response?.data?.error || 'Upload failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>📤 Upload Study Material</h2>
        <p>Upload a PDF/text file or paste your notes directly</p>
      </div>

      <div className="tabs">
        <button className={`tab ${mode === 'file' ? 'active' : ''}`} onClick={() => setMode('file')}>
          <i className="fa-solid fa-file-arrow-up"></i> Upload File
        </button>
        <button className={`tab ${mode === 'text' ? 'active' : ''}`} onClick={() => setMode('text')}>
          <i className="fa-solid fa-keyboard"></i> Paste Text
        </button>
      </div>

      {mode === 'file' ? (
        <div>
          <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {file ? (
              <>
                <i className={`fa-solid ${file.name.endsWith('.pdf') ? 'fa-file-pdf' : 'fa-file-alt'}`} style={{ color: 'var(--success)' }}></i>
                <h3>{file.name}</h3>
                <p>{(file.size / 1024).toFixed(1)} KB — Click to change</p>
              </>
            ) : (
              <>
                <i className="fa-solid fa-cloud-arrow-up"></i>
                <h3>Drag & Drop your file here</h3>
                <p>Supports PDF, TXT, and MD files (Max 10MB)</p>
              </>
            )}
            <input ref={fileRef} type="file" accept=".pdf,.txt,.md" onChange={handleFileSelect} style={{ display: 'none' }} />
          </div>

          {file && (
            <div className="form-group" style={{ marginTop: 20 }}>
              <label>Note Title</label>
              <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter a title for your note" />
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="form-group">
            <label>Note Title</label>
            <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="E.g., Chapter 5 - Data Structures" />
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea className="form-textarea" value={textContent} onChange={(e) => setTextContent(e.target.value)}
              placeholder="Paste your study notes here..." style={{ minHeight: 250 }}
            />
          </div>
        </div>
      )}

      <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
        <button className="btn btn-primary btn-lg" onClick={handleUpload} disabled={loading}>
          {loading ? <><span className="spinner" style={{ width: 18, height: 18 }}></span> Processing...</>
            : <><i className="fa-solid fa-check"></i> Save Note</>}
        </button>
        <button className="btn btn-secondary btn-lg" onClick={() => navigate('/')}>Cancel</button>
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getNotes, generateSummary, getSummaries } from '../services/api';

export default function Summarize() {
  const [searchParams] = useSearchParams();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [summary, setSummary] = useState(null);
  const [pastSummaries, setPastSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { loadNotes(); }, []);

  useEffect(() => {
    if (selectedNote) loadSummaries();
  }, [selectedNote]);

  const loadNotes = async () => {
    try {
      const { data } = await getNotes();
      setNotes(data);
      const noteIdParam = searchParams.get('noteId');
      if (noteIdParam) {
        const found = data.find(n => n.id === parseInt(noteIdParam));
        if (found) setSelectedNote(found);
      }
    } catch (err) { console.error(err); }
  };

  const loadSummaries = async () => {
    try {
      const { data } = await getSummaries(selectedNote.id);
      setPastSummaries(data);
      if (data.length > 0) setSummary(data[0].summary);
    } catch (err) { console.error(err); }
  };

  const handleGenerate = async () => {
    if (!selectedNote) return;
    setLoading(true); setSummary(null);
    try {
      const { data } = await generateSummary(selectedNote.id);
      setSummary(data.summary);
      setPastSummaries(prev => [data, ...prev]);
      setToast({ message: 'Summary generated!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to generate summary', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally { setLoading(false); }
  };

  if (!selectedNote) {
    return (
      <div>
        <div className="page-header">
          <h2>📝 AI Summarizer</h2>
          <p>Select a note to generate an AI-powered summary</p>
        </div>
        {notes.length === 0 ? (
          <div className="empty-state">
            <i className="fa-solid fa-book-open"></i>
            <h3>No notes available</h3>
            <p>Upload some study materials first!</p>
          </div>
        ) : (
          <div className="note-selector">
            <h3>📚 Select a Note</h3>
            <div className="note-select-list">
              {notes.map(note => (
                <div key={note.id} className="note-select-item" onClick={() => setSelectedNote(note)}>
                  <div className={`file-icon ${note.file_type === 'pdf' ? 'pdf' : 'text'}`} style={{ width: 36, height: 36, fontSize: 14 }}>
                    <i className={note.file_type === 'pdf' ? 'fa-solid fa-file-pdf' : 'fa-solid fa-file-alt'}></i>
                  </div>
                  <div>
                    <strong style={{ fontSize: 14 }}>{note.title}</strong>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(note.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h2>📝 AI Summarizer</h2>
        <p>Summarizing: <strong>{selectedNote.title}</strong></p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button className="btn btn-primary btn-lg" onClick={handleGenerate} disabled={loading}>
          {loading ? <><span className="spinner" style={{ width: 18, height: 18 }}></span> Generating...</>
            : <><i className="fa-solid fa-wand-magic-sparkles"></i> Generate Summary</>}
        </button>
        <button className="btn btn-secondary" onClick={() => { setSelectedNote(null); setSummary(null); setPastSummaries([]); }}>
          <i className="fa-solid fa-arrow-left"></i> Change Note
        </button>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div className="loading-spinner" style={{ justifyContent: 'center' }}>
            <span className="spinner" style={{ width: 32, height: 32 }}></span>
          </div>
          <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>AI is analyzing your notes<span className="loading-dots"></span></p>
        </div>
      )}

      {summary && !loading && (
        <div className="summary-content">
          <ReactMarkdown>{summary}</ReactMarkdown>
        </div>
      )}

      {!summary && !loading && pastSummaries.length === 0 && (
        <div className="empty-state">
          <i className="fa-solid fa-wand-magic-sparkles"></i>
          <h3>No summary yet</h3>
          <p>Click "Generate Summary" to create an AI-powered summary of your notes</p>
        </div>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}

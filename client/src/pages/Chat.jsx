import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { getNotes, sendMessage, getChatHistory, clearChat } from '../services/api';

export default function Chat() {
  const [searchParams] = useSearchParams();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    if (selectedNote) loadChat();
  }, [selectedNote]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const loadChat = async () => {
    try {
      const { data } = await getChatHistory(selectedNote.id);
      setMessages(data);
    } catch (err) { console.error(err); }
  };

  const handleSend = async () => {
    if (!input.trim() || !selectedNote || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', message: userMsg, id: Date.now() }]);
    setLoading(true);
    try {
      const { data } = await sendMessage(selectedNote.id, userMsg);
      setMessages(prev => [...prev, { role: 'assistant', message: data.message, id: Date.now() + 1 }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', message: `❌ Error: ${err.response?.data?.error || err.message}`, id: Date.now() + 1 }]);
    } finally { setLoading(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleClearChat = async () => {
    if (!selectedNote) return;
    try { await clearChat(selectedNote.id); setMessages([]); } catch (err) { console.error(err); }
  };

  if (!selectedNote) {
    return (
      <div>
        <div className="page-header">
          <h2>💬 AI Chat</h2>
          <p>Select a note to start chatting with AI about it</p>
        </div>
        {notes.length === 0 ? (
          <div className="empty-state">
            <i className="fa-solid fa-book-open"></i>
            <h3>No notes available</h3>
            <p>Upload some study materials first to start chatting!</p>
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
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h2>💬 AI Chat</h2>
        <p>Chatting about: <strong>{selectedNote.title}</strong></p>
      </div>

      <div className="chat-container">
        <div className="chat-header">
          <h3><i className="fa-solid fa-book" style={{ marginRight: 8 }}></i>{selectedNote.title}</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedNote(null)}>
              <i className="fa-solid fa-arrow-left"></i> Change Note
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleClearChat}>
              <i className="fa-solid fa-trash"></i> Clear
            </button>
          </div>
        </div>

        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="empty-state" style={{ padding: 40 }}>
              <i className="fa-solid fa-robot" style={{ fontSize: 48 }}></i>
              <h3>Start a conversation!</h3>
              <p>Ask me anything about "<strong>{selectedNote.title}</strong>"</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-message ${msg.role}`}>
              <div className="message-avatar">
                <i className={msg.role === 'user' ? 'fa-solid fa-user' : 'fa-solid fa-robot'}></i>
              </div>
              <div className="message-content">
                <ReactMarkdown>{msg.message}</ReactMarkdown>
              </div>
            </div>
          ))}
          {loading && (
            <div className="chat-message assistant">
              <div className="message-avatar"><i className="fa-solid fa-robot"></i></div>
              <div className="message-content">
                <div className="loading-spinner" style={{ padding: 8 }}>
                  <span className="spinner"></span> Thinking...
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about your notes..."
            disabled={loading}
          />
          <button className="btn btn-primary" onClick={handleSend} disabled={loading || !input.trim()}>
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

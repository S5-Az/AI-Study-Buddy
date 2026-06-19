import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStats, getNotes } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({ totalNotes: 0, totalChats: 0, totalQuizzes: 0, totalSummaries: 0, averageQuizScore: null });
  const [recentNotes, setRecentNotes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, notesRes] = await Promise.all([getStats(), getNotes()]);
      setStats(statsRes.data);
      setRecentNotes(notesRes.data.slice(0, 4));
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    }
  };

  const statCards = [
    { icon: 'fa-solid fa-book', label: 'Total Notes', value: stats.totalNotes, color: 'purple' },
    { icon: 'fa-solid fa-comments', label: 'Chat Messages', value: stats.totalChats, color: 'blue' },
    { icon: 'fa-solid fa-brain', label: 'Quizzes Taken', value: stats.totalQuizzes, color: 'green' },
    { icon: 'fa-solid fa-file-lines', label: 'Summaries', value: stats.totalSummaries, color: 'orange' },
  ];

  return (
    <div>
      <div className="welcome-banner">
        <h2>👋 Welcome to AI Study Buddy</h2>
        <p>Upload your notes, chat with AI, generate summaries & take quizzes — all powered by local AI!</p>
      </div>

      <div className="stats-grid">
        {statCards.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className={`stat-icon ${stat.color}`}>
              <i className={stat.icon}></i>
            </div>
            <div className="stat-info">
              <h3>{stat.value}</h3>
              <p>{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {stats.averageQuizScore !== null && (
        <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="stat-icon green"><i className="fa-solid fa-chart-line"></i></div>
          <div>
            <h3 style={{ fontSize: 18 }}>Average Quiz Score: {stats.averageQuizScore}%</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Keep practicing to improve!</p>
          </div>
        </div>
      )}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>📚 Recent Notes</h2>
          <p>Your recently uploaded study materials</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/upload')}>
          <i className="fa-solid fa-plus"></i> Upload New
        </button>
      </div>

      {recentNotes.length === 0 ? (
        <div className="empty-state">
          <i className="fa-solid fa-book-open"></i>
          <h3>No notes yet</h3>
          <p>Upload your first study material to get started!</p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/upload')}>
            <i className="fa-solid fa-cloud-arrow-up"></i> Upload Notes
          </button>
        </div>
      ) : (
        <div className="card-grid">
          {recentNotes.map((note) => (
            <div key={note.id} className="note-card">
              <div className="note-card-header">
                <div className={`file-icon ${note.file_type === 'pdf' ? 'pdf' : 'text'}`}>
                  <i className={note.file_type === 'pdf' ? 'fa-solid fa-file-pdf' : 'fa-solid fa-file-alt'}></i>
                </div>
              </div>
              <h3 title={note.title}>{note.title}</h3>
              <div className="meta">
                <span><i className="fa-solid fa-calendar"></i> {new Date(note.created_at).toLocaleDateString()}</span>
                <span><i className="fa-solid fa-text-width"></i> {Math.round(note.content_length / 100) * 100}+ chars</span>
              </div>
              <div className="note-card-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/chat?noteId=${note.id}`)}>
                  <i className="fa-solid fa-comments"></i> Chat
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/summarize?noteId=${note.id}`)}>
                  <i className="fa-solid fa-file-lines"></i> Summary
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/quiz?noteId=${note.id}`)}>
                  <i className="fa-solid fa-brain"></i> Quiz
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

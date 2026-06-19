import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Chat from './pages/Chat';
import Summarize from './pages/Summarize';
import Quiz from './pages/Quiz';
import { getHealth } from './services/api';

function AppContent() {
  const [ollamaStatus, setOllamaStatus] = useState({ running: false, models: [] });
  const location = useLocation();

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const { data } = await getHealth();
      setOllamaStatus({ running: data.ollama === 'connected', models: data.models });
    } catch {
      setOllamaStatus({ running: false, models: [] });
    }
  };

  const navItems = [
    { path: '/', icon: 'fa-solid fa-house', label: 'Dashboard' },
    { path: '/upload', icon: 'fa-solid fa-cloud-arrow-up', label: 'Upload Notes' },
    { path: '/chat', icon: 'fa-solid fa-comments', label: 'AI Chat' },
    { path: '/summarize', icon: 'fa-solid fa-file-lines', label: 'Summarizer' },
    { path: '/quiz', icon: 'fa-solid fa-brain', label: 'Quiz Generator' },
  ];

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <NavLink to="/" className="sidebar-logo">
          <div className="logo-icon"><i className="fa-solid fa-graduation-cap"></i></div>
          <h1>Study Buddy</h1>
        </NavLink>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end={item.path === '/'}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className={`ollama-status ${ollamaStatus.running ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            <span>Ollama: {ollamaStatus.running ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:noteId" element={<Chat />} />
          <Route path="/summarize" element={<Summarize />} />
          <Route path="/quiz" element={<Quiz />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

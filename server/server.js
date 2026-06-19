const express = require('express');
const cors = require('cors');
const path = require('path');
const { checkOllamaStatus } = require('./services/ollamaService');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const notesRoutes = require('./routes/notes');
const chatRoutes = require('./routes/chat');
const summarizeRoutes = require('./routes/summarize');
const quizRoutes = require('./routes/quiz');

// Use routes
app.use('/api/notes', notesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/summarize', summarizeRoutes);
app.use('/api/quiz', quizRoutes);

// Health check & Ollama status
app.get('/api/health', async (req, res) => {
  const ollamaStatus = await checkOllamaStatus();
  res.json({
    server: 'running',
    ollama: ollamaStatus.running ? 'connected' : 'disconnected',
    models: ollamaStatus.models,
    timestamp: new Date().toISOString()
  });
});

// Dashboard stats
app.get('/api/stats', (req, res) => {
  try {
    const db = require('./db/database');
    const totalNotes = db.prepare('SELECT COUNT(*) as count FROM notes').get().count;
    const totalChats = db.prepare('SELECT COUNT(*) as count FROM chats').get().count;
    const totalQuizzes = db.prepare('SELECT COUNT(*) as count FROM quizzes').get().count;
    const totalSummaries = db.prepare('SELECT COUNT(*) as count FROM summaries').get().count;
    const avgScore = db.prepare('SELECT AVG(score * 100.0 / total) as avg FROM quizzes WHERE score IS NOT NULL').get().avg;

    res.json({
      totalNotes,
      totalChats,
      totalQuizzes,
      totalSummaries,
      averageQuizScore: avgScore ? Math.round(avgScore) : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║     🎓 AI Study Buddy Server             ║
  ║     Running on http://localhost:${PORT}  ║
  ╚══════════════════════════════════════════╝
  `);
});

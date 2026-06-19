const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db/database');
const { extractText } = require('../services/pdfService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, TXT, and MD files are allowed'));
    }
  }
});

// POST /api/notes/upload - Upload a file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, mimetype, path: filePath } = req.file;
    const title = req.body.title || originalname;

    // Extract text from file
    const content = await extractText(filePath, mimetype);

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Could not extract text from the uploaded file.' });
    }

    // Save to database
    const stmt = db.prepare(
      'INSERT INTO notes (title, content, file_path, file_type) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(title, content, filePath, mimetype === 'application/pdf' ? 'pdf' : 'text');

    res.status(201).json({
      id: result.lastInsertRowid,
      title,
      file_type: mimetype === 'application/pdf' ? 'pdf' : 'text',
      content_length: content.length,
      message: 'File uploaded and processed successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/notes/text - Add text note directly
router.post('/text', (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const stmt = db.prepare(
      'INSERT INTO notes (title, content, file_type) VALUES (?, ?, ?)'
    );
    const result = stmt.run(title, content, 'text');

    res.status(201).json({
      id: result.lastInsertRowid,
      title,
      file_type: 'text',
      content_length: content.length,
      message: 'Note saved successfully'
    });
  } catch (error) {
    console.error('Save note error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/notes - List all notes
router.get('/', (req, res) => {
  try {
    const notes = db.prepare(
      'SELECT id, title, file_type, LENGTH(content) as content_length, created_at FROM notes ORDER BY created_at DESC'
    ).all();
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/notes/:id - Get single note
router.get('/:id', (req, res) => {
  try {
    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/notes/:id - Delete a note
router.delete('/:id', (req, res) => {
  try {
    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Delete file if exists
    if (note.file_path && fs.existsSync(note.file_path)) {
      fs.unlinkSync(note.file_path);
    }

    // Delete from DB (cascades to chats, summaries, quizzes)
    db.prepare('DELETE FROM chats WHERE note_id = ?').run(req.params.id);
    db.prepare('DELETE FROM summaries WHERE note_id = ?').run(req.params.id);
    db.prepare('DELETE FROM quizzes WHERE note_id = ?').run(req.params.id);
    db.prepare('DELETE FROM notes WHERE id = ?').run(req.params.id);

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

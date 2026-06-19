const express = require('express');
const db = require('../db/database');
const { chatWithAI } = require('../services/ollamaService');

const router = express.Router();

// POST /api/summarize/:noteId - Generate summary
router.post('/:noteId', async (req, res) => {
  try {
    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.noteId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Truncate if too long
    const truncatedContent = note.content.length > 4000
      ? note.content.substring(0, 4000) + '\n\n[...content truncated...]'
      : note.content;

    const systemPrompt = `You are an expert study assistant that creates clear, comprehensive summaries of study materials.`;

    const prompt = `Please provide a detailed summary of the following study material titled "${note.title}".

Structure your summary as follows:
## 📋 Overview
A brief 2-3 sentence overview of what this material covers.

## 🔑 Key Concepts
List the main concepts/topics covered with brief explanations.

## 📝 Important Points
Bullet points of the most important facts, formulas, or details to remember.

## 💡 Quick Revision Notes
A very brief section (3-5 bullet points) for last-minute revision.

---
Study Material:
${truncatedContent}
---`;

    const summary = await chatWithAI(prompt, systemPrompt, 'llama3.2:latest');

    // Save summary
    const stmt = db.prepare('INSERT INTO summaries (note_id, summary) VALUES (?, ?)');
    const result = stmt.run(req.params.noteId, summary);

    res.json({
      id: result.lastInsertRowid,
      note_id: parseInt(req.params.noteId),
      summary,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Summarize error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/summarize/:noteId - Get saved summaries
router.get('/:noteId', (req, res) => {
  try {
    const summaries = db.prepare(
      'SELECT * FROM summaries WHERE note_id = ? ORDER BY created_at DESC'
    ).all(req.params.noteId);
    res.json(summaries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

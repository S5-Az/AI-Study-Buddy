const express = require('express');
const db = require('../db/database');
const { chatWithHistory } = require('../services/ollamaService');

const router = express.Router();

// POST /api/chat - Send a message and get AI response
router.post('/', async (req, res) => {
  try {
    const { noteId, message } = req.body;

    if (!noteId || !message) {
      return res.status(400).json({ error: 'noteId and message are required' });
    }

    // Get the note content for context
    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(noteId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    // Save user message
    db.prepare('INSERT INTO chats (note_id, role, message) VALUES (?, ?, ?)').run(noteId, 'user', message);

    // Get chat history for context (last 10 messages)
    const history = db.prepare(
      'SELECT role, message as content FROM chats WHERE note_id = ? ORDER BY created_at DESC LIMIT 10'
    ).all(noteId).reverse();

    // Truncate note content if too long (keep first 3000 chars for context)
    const truncatedContent = note.content.length > 3000
      ? note.content.substring(0, 3000) + '\n\n[...content truncated for context window...]'
      : note.content;

    const systemPrompt = `You are an AI Study Buddy assistant. You help students understand their study materials. 
You have access to the following study material titled "${note.title}":

---
${truncatedContent}
---

Instructions:
- Answer questions based on the study material above
- Be helpful, clear, and educational
- Use examples when possible
- If the question is not related to the material, politely let them know
- Format your responses with markdown for better readability
- Keep answers concise but thorough`;

    // Get AI response
    const aiResponse = await chatWithHistory(
      history.map(h => ({ role: h.role, content: h.content })),
      systemPrompt
    );

    // Save assistant response
    db.prepare('INSERT INTO chats (note_id, role, message) VALUES (?, ?, ?)').run(noteId, 'assistant', aiResponse);

    res.json({
      role: 'assistant',
      message: aiResponse
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/chat/:noteId - Get chat history
router.get('/:noteId', (req, res) => {
  try {
    const chats = db.prepare(
      'SELECT * FROM chats WHERE note_id = ? ORDER BY created_at ASC'
    ).all(req.params.noteId);
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/chat/:noteId - Clear chat history
router.delete('/:noteId', (req, res) => {
  try {
    db.prepare('DELETE FROM chats WHERE note_id = ?').run(req.params.noteId);
    res.json({ message: 'Chat history cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

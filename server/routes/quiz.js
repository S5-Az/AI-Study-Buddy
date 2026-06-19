const express = require('express');
const db = require('../db/database');
const { chatWithAI } = require('../services/ollamaService');

const router = express.Router();

// POST /api/quiz/generate/:noteId - Generate quiz
router.post('/generate/:noteId', async (req, res) => {
  try {
    const note = db.prepare('SELECT * FROM notes WHERE id = ?').get(req.params.noteId);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const numQuestions = req.body.numQuestions || 5;

    // Truncate if too long
    const truncatedContent = note.content.length > 4000
      ? note.content.substring(0, 4000) + '\n\n[...content truncated...]'
      : note.content;

    const systemPrompt = `You are a quiz generator. You MUST respond with ONLY valid JSON, no other text before or after the JSON. Do not include markdown code fences.`;

    const prompt = `Generate exactly ${numQuestions} multiple choice questions based on this study material titled "${note.title}".

RESPOND WITH ONLY THIS JSON FORMAT, nothing else:
[
  {
    "id": 1,
    "question": "What is...?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation of the correct answer"
  }
]

The "correctAnswer" field is the INDEX (0-3) of the correct option.
Make questions that test understanding, not just memorization.

Study Material:
${truncatedContent}`;

    const aiResponse = await chatWithAI(prompt, systemPrompt);

    // Try to parse the JSON response
    let questions;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      } else {
        questions = JSON.parse(aiResponse);
      }
    } catch (parseError) {
      console.error('Failed to parse quiz JSON:', aiResponse);
      return res.status(500).json({ 
        error: 'AI generated invalid quiz format. Please try again.',
        raw: aiResponse
      });
    }

    // Validate and clean questions
    questions = questions.map((q, index) => ({
      id: index + 1,
      question: q.question || `Question ${index + 1}`,
      options: Array.isArray(q.options) ? q.options.slice(0, 4) : ['A', 'B', 'C', 'D'],
      correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
      explanation: q.explanation || 'No explanation provided.'
    }));

    // Save quiz
    const stmt = db.prepare('INSERT INTO quizzes (note_id, questions, total) VALUES (?, ?, ?)');
    const result = stmt.run(req.params.noteId, JSON.stringify(questions), questions.length);

    res.json({
      id: result.lastInsertRowid,
      note_id: parseInt(req.params.noteId),
      questions,
      total: questions.length,
      created_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/quiz/:id/submit - Submit quiz answers
router.post('/:id/submit', (req, res) => {
  try {
    const { answers } = req.body; // Array of selected answer indices

    const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(req.params.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const questions = JSON.parse(quiz.questions);
    let score = 0;

    const results = questions.map((q, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === q.correctAnswer;
      if (isCorrect) score++;

      return {
        ...q,
        userAnswer,
        isCorrect
      };
    });

    // Update score in DB
    db.prepare('UPDATE quizzes SET score = ? WHERE id = ?').run(score, req.params.id);

    res.json({
      score,
      total: questions.length,
      percentage: Math.round((score / questions.length) * 100),
      results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/quiz/:noteId - Get quizzes for a note
router.get('/:noteId', (req, res) => {
  try {
    const quizzes = db.prepare(
      'SELECT * FROM quizzes WHERE note_id = ? ORDER BY created_at DESC'
    ).all(req.params.noteId);

    // Parse questions JSON
    const parsed = quizzes.map(q => ({
      ...q,
      questions: JSON.parse(q.questions)
    }));

    res.json(parsed);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getNotes, generateQuiz, submitQuiz } from '../services/api';

export default function Quiz() {
  const [searchParams] = useSearchParams();
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [numQuestions, setNumQuestions] = useState(5);
  const [toast, setToast] = useState(null);

  useEffect(() => { loadNotes(); }, []);

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

  const handleGenerate = async () => {
    if (!selectedNote) return;
    setLoading(true); setQuiz(null); setResults(null); setAnswers({});
    try {
      const { data } = await generateQuiz(selectedNote.id, numQuestions);
      setQuiz(data);
    } catch (err) {
      setToast({ message: err.response?.data?.error || 'Failed to generate quiz', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally { setLoading(false); }
  };

  const selectAnswer = (questionIdx, optionIdx) => {
    if (results) return;
    setAnswers(prev => ({ ...prev, [questionIdx]: optionIdx }));
  };

  const handleSubmit = async () => {
    if (!quiz || Object.keys(answers).length !== quiz.questions.length) {
      setToast({ message: 'Please answer all questions', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    try {
      const answerArray = quiz.questions.map((_, i) => answers[i]);
      const { data } = await submitQuiz(quiz.id, answerArray);
      setResults(data);
    } catch (err) {
      setToast({ message: 'Failed to submit quiz', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  if (!selectedNote) {
    return (
      <div>
        <div className="page-header">
          <h2>🧠 Quiz Generator</h2>
          <p>Test your knowledge with AI-generated quizzes</p>
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
        <h2>🧠 Quiz Generator</h2>
        <p>Testing: <strong>{selectedNote.title}</strong></p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>Questions:</label>
          <select className="form-select" value={numQuestions} onChange={(e) => setNumQuestions(parseInt(e.target.value))}
            style={{ width: 80 }}>
            <option value={3}>3</option>
            <option value={5}>5</option>
            <option value={10}>10</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
          {loading ? <><span className="spinner" style={{ width: 18, height: 18 }}></span> Generating...</>
            : <><i className="fa-solid fa-wand-magic-sparkles"></i> Generate Quiz</>}
        </button>
        <button className="btn btn-secondary" onClick={() => { setSelectedNote(null); setQuiz(null); setResults(null); }}>
          <i className="fa-solid fa-arrow-left"></i> Change Note
        </button>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: 60 }}>
          <div className="loading-spinner" style={{ justifyContent: 'center' }}>
            <span className="spinner" style={{ width: 32, height: 32 }}></span>
          </div>
          <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>AI is creating your quiz<span className="loading-dots"></span></p>
        </div>
      )}

      {results && (
        <div className="quiz-score">
          <div className="score-circle">{results.percentage}%</div>
          <h3 style={{ fontSize: 22, marginBottom: 4 }}>
            {results.percentage >= 80 ? '🎉 Excellent!' : results.percentage >= 60 ? '👍 Good Job!' : '📚 Keep Studying!'}
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            You scored {results.score} out of {results.total}
          </p>
        </div>
      )}

      {quiz && quiz.questions.map((q, qIdx) => {
        const result = results?.results?.[qIdx];
        return (
          <div key={qIdx} className="quiz-question">
            <h4>
              <span className="question-number">{qIdx + 1}</span>
              <span>{q.question}</span>
            </h4>
            <div className="quiz-options">
              {q.options.map((opt, oIdx) => {
                let className = 'quiz-option';
                if (!results && answers[qIdx] === oIdx) className += ' selected';
                if (result) {
                  if (oIdx === q.correctAnswer) className += ' correct';
                  else if (oIdx === result.userAnswer && !result.isCorrect) className += ' wrong';
                }
                return (
                  <div key={oIdx} className={className} onClick={() => selectAnswer(qIdx, oIdx)}>
                    <span className="option-marker">
                      {result ? (oIdx === q.correctAnswer ? '✓' : oIdx === result.userAnswer && !result.isCorrect ? '✗' : String.fromCharCode(65 + oIdx))
                        : String.fromCharCode(65 + oIdx)}
                    </span>
                    <span>{opt}</span>
                  </div>
                );
              })}
            </div>
            {result && (
              <div className="quiz-explanation">
                <strong>💡 Explanation:</strong> {q.explanation}
              </div>
            )}
          </div>
        );
      })}

      {quiz && !results && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button className="btn btn-primary btn-lg" onClick={handleSubmit}>
            <i className="fa-solid fa-check-double"></i> Submit Answers
          </button>
        </div>
      )}

      {quiz && results && (
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button className="btn btn-primary btn-lg" onClick={handleGenerate}>
            <i className="fa-solid fa-rotate"></i> Take Another Quiz
          </button>
        </div>
      )}

      {!quiz && !loading && (
        <div className="empty-state">
          <i className="fa-solid fa-brain"></i>
          <h3>Ready to test yourself?</h3>
          <p>Click "Generate Quiz" to create an AI-powered quiz from your notes</p>
        </div>
      )}

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </div>
  );
}

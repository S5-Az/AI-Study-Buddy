import axios from 'axios';

const API = axios.create({ baseURL: '/api' });

// Notes
export const uploadNote = (formData) => API.post('/notes/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const addTextNote = (data) => API.post('/notes/text', data);
export const getNotes = () => API.get('/notes');
export const getNote = (id) => API.get(`/notes/${id}`);
export const deleteNote = (id) => API.delete(`/notes/${id}`);

// Chat
export const sendMessage = (noteId, message) => API.post('/chat', { noteId, message });
export const getChatHistory = (noteId) => API.get(`/chat/${noteId}`);
export const clearChat = (noteId) => API.delete(`/chat/${noteId}`);

// Summarize
export const generateSummary = (noteId) => API.post(`/summarize/${noteId}`);
export const getSummaries = (noteId) => API.get(`/summarize/${noteId}`);

// Quiz
export const generateQuiz = (noteId, numQuestions = 5) => API.post(`/quiz/generate/${noteId}`, { numQuestions });
export const submitQuiz = (quizId, answers) => API.post(`/quiz/${quizId}/submit`, { answers });
export const getQuizzes = (noteId) => API.get(`/quiz/${noteId}`);

// Health
export const getHealth = () => API.get('/health');
export const getStats = () => API.get('/stats');

# 🎓 AI Study Buddy
**AI Study Buddy** is an intelligent, locally-hosted study assistant designed to help students learn faster and more effectively. By leveraging the power of local Large Language Models (LLMs) via Ollama, it allows users to upload their study materials, generate comprehensive summaries, interactively chat with their notes, and test their knowledge with auto-generated quizzes.
This project was developed as a **B.Tech Final Year Project**.
---
## ✨ Features
- **📤 Document Upload & Parsing**: Upload PDF documents or plain text files, or paste your notes directly. The system extracts and processes the text for AI analysis.
- **💬 Interactive AI Chat**: Have a conversation with your notes. Ask questions, seek clarifications, and get answers based strictly on the uploaded material.
- **📝 Smart Summarization**: Instantly generate structured, easy-to-read summaries of long study materials, highlighting key concepts and important points.
- **🧠 Auto-Quiz Generation**: Automatically generate Multiple Choice Questions (MCQs) from your notes to test your understanding. Features interactive UI with instant feedback and explanations.
- **📊 User Dashboard**: Track your study progress with statistics on notes uploaded, quizzes taken, and average scores.
- **🔒 100% Local & Private**: Powered by Ollama, all AI processing happens locally on your machine. No data is sent to external APIs, ensuring complete privacy.
---
## 🛠️ Tech Stack
### Frontend
- **Framework**: React 18 with Vite
- **Routing**: React Router DOM
- **Styling**: Vanilla CSS (Custom Design System with Glassmorphism)
- **Markdown Rendering**: React Markdown
### Backend
- **Server**: Node.js with Express.js
- **Database**: SQLite (via `better-sqlite3`)
- **File Handling**: Multer (for uploads), `pdf-parse` (for PDF text extraction)
- **AI Integration**: Custom Ollama API integration wrapper
### AI Engine
- **Ollama**: Running locally (`llama3` or `mistral` models recommended)
---
## 📋 Prerequisites
Before running this project, ensure you have the following installed on your system:
1. **Node.js** (v18.0 or higher) - [Download here](https://nodejs.org/)
2. **Ollama** - [Download here](https://ollama.ai/)
3. **Local AI Model**: Pull a model using Ollama in your terminal:
   ```bash
   ollama pull llama3
   ```
---
## 🚀 Setup & Installation Instructions
Follow these steps to get the project running on your local machine.
### 1. Clone/Setup the Repository
Ensure you are in the root directory of the project (`study-buddy`).
### 2. Start the AI Engine (Ollama)
Open a terminal and ensure Ollama is running in the background:
```bash
ollama serve
```
### 3. Setup the Backend (Server)
Open a new terminal window/tab:
```bash
# Navigate to the server directory
cd server
# Install dependencies
npm install
# Start the development server
npm run dev
```
*The backend server will start on `http://localhost:5000` and automatically initialize the SQLite database.*
### 4. Setup the Frontend (Client)
Open another new terminal window/tab:
```bash
# Navigate to the client directory
cd client
# Install dependencies
npm install
# Start the Vite development server
npm run dev
```
*The frontend application will be available at `http://localhost:3000`.*
---
## 📁 Project Architecture
```
study-buddy/
├── client/                     # Frontend React Application
│   ├── public/
│   ├── src/
│   │   ├── pages/              # React Views (Dashboard, Chat, Quiz, etc.)
│   │   ├── services/           # API integration (Axios)
│   │   ├── App.jsx             # Main routing component
│   │   └── index.css           # Global design system
│   ├── package.json
│   └── vite.config.js          # Vite config with API proxy
│
├── server/                     # Backend Node.js Application
│   ├── db/                     # SQLite database initialization & schema
│   ├── routes/                 # Express API endpoints
│   ├── services/               # Core logic (Ollama API, PDF parsing)
│   ├── uploads/                # Local storage for uploaded PDFs
│   ├── server.js               # Main Express entry point
│   └── package.json
│
└── README.md
```
---
## 🔌 Core API Endpoints
- **`POST /api/notes/upload`**: Upload and parse a PDF/TXT file.
- **`POST /api/chat`**: Send a message to the AI with note context.
- **`POST /api/summarize/:noteId`**: Trigger AI summary generation.
- **`POST /api/quiz/generate/:noteId`**: Generate an MCQ quiz.
---

![alt text](<Screenshot 2026-06-19 212105.png>)

---
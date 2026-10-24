# Task Mate 🚀

Task Mate is a collaborative task and project management web application built with **React 19**, **Vite**, **Tailwind CSS v4**, and **Firebase** (Authentication, Cloud Firestore, and Hosting).

Live Demo: [https://taskmate-hmb.web.app](https://taskmate-hmb.web.app)

---

## ✨ Features

- **Project & Workspace Management**: Organize tasks into multiple projects with custom colors and priorities.
- **Interactive Kanban / Task Board**: Filter by status, priority, and search queries with instant updates.
- **Real-Time Collaboration**: Real-time synchronization across devices using Firebase Cloud Firestore with offline cache support.
- **Team Management & Invite Links**: Generate project invite codes or links to invite teammates.
- **Dual-Mode System**:
  - **Firebase Mode**: Cloud authentication and Firestore persistence for teams.
  - **Demo / Offline Mode**: LocalStorage fallback for instant preview without requiring an account.
- **Audit Logs & Comments**: Track activity timelines and discuss tasks via real-time threaded comments.
- **Productivity Dashboard**: Visual overview of completed, in-progress, and overdue tasks.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite 8
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Icons**: Lucide React
- **Backend & Auth**: Firebase Auth & Cloud Firestore
- **Hosting**: Firebase Hosting

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/TaskMate.git
cd TaskMate
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env.local` file in the root directory based on `.env.example`:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Run the development server
```bash
npm run dev
```

The app will be available at `http://localhost:8443` (or the port specified by Vite).

---

## 📦 Build & Deploy

### Build for Production
```bash
npm run build
```

### Deploy to Firebase
```bash
# Deploy hosting and Firestore security rules
npx firebase-tools deploy --project <your-project-id>
```

---

## 🔒 Security Rules

Security rules are defined in `firestore.rules` and enforce:
- Authenticated user access.
- Project-level authorization (members and owners).
- Task and comment validation.

# Task Mate — App Overview & Run Guide

**Task Mate** is a collaborative, real-time task and project management web application designed for student groups and agile teams. It solves the common problem of unfair group workload by making task ownership, deadlines, and live progress clear, neutral, and visible to everyone.

---

## 1. How the Application Works

### Core Architecture
Task Mate is built as a single-page application (SPA) using **React 19**, **TypeScript**, and **Tailwind CSS v4**, backed by **Google Firebase**.

```
┌────────────────────────────────────────────────────────┐
│                   React 19 Frontend                    │
│   (AuthContext, Dual-Mode Store, Responsive Screens)   │
└──────────────┬───────────────────────────┬─────────────┘
               │                           │
      [Live Mode]                 [Demo Mode]
               ▼                           ▼
┌──────────────────────────────┐  ┌──────────────────────┐
│       Firebase Backend       │  │     LocalStorage     │
│ - Firebase Authentication    │  │ - Sample data set    │
│ - Cloud Firestore Database   │  │ - Full offline test  │
│   (Multi-tab offline cache)  │  │ - Zero setup needed  │
└──────────────────────────────┘  └──────────────────────┘
```

### Key Workflows & Features

1. **Dual-Mode Operation**:
   - **Live Cloud Mode**: When connected to Firebase, users sign up with email/password. All projects, tasks, activity logs, and comments sync instantly across devices.
   - **Demo Mode**: If opened without a network connection or without creating an account, users can explore a preloaded demo workspace saved locally in their browser.

2. **Authentication & User Profiles**:
   - Handles email/password registration, login, session persistence, and password reset.
   - Each registered user has a private profile in Firestore (`users/{uid}`) storing their preferences (high-contrast mode, UI scale, notification toggles) and project list.

3. **Projects & Team Collaboration**:
   - **Project Creation**: Users can create multiple separate workspaces.
   - **Invite Codes**: Each project generates an 8-character unique invite code (e.g. `J8X2K9M4`). Teammates join instantly by entering this code without requiring invitation emails.
   - **Roles & Presence**: Members have assignable roles (e.g., Coordinator, Researcher, Developer) and color-coded avatars.

4. **Task Management (Kanban Board)**:
   - Tasks move across 4 core statuses: **To Do**, **In Progress**, **Stuck**, and **Done**.
   - Tasks feature due dates, detailed descriptions, subtask checklists, and dedicated discussion threads.
   - The **Stuck** status provides a neutral, blameless way for team members to flag blockers early.

5. **Discussions & Activity Audit Trail**:
   - Every task has an attached comment stream.
   - Project activity is tracked chronologically, logging when tasks are created, reassigned, marked stuck, or completed.

6. **Accessibility & Personalization**:
   - Built-in accessibility settings support high-contrast display, UI scaling (up to 150%), reduced motion/calm view, and keyboard navigation.

---

## 2. Project Directory Structure

```
TaskMate/
├── .github/workflows/          # CI/CD deployment pipelines (GitHub Actions)
├── public/                     # Static assets (favicons, robots.txt)
├── src/
│   ├── screens/                # UI Views
│   │   ├── Login.tsx           # Sign-in, registration, password reset, demo mode
│   │   ├── Dashboard.tsx       # Progress overview, deadlines, activity feed
│   │   ├── Tasks.tsx           # Interactive Kanban board & task filtering
│   │   ├── TaskDetail.tsx      # Task side-panel, subtasks, & comment thread
│   │   ├── TaskModal.tsx       # Create / edit task modal
│   │   ├── Projects.tsx        # Switch projects or create/join via invite code
│   │   ├── Team.tsx            # Members roster, invite codes, role management
│   │   ├── Notifications.tsx   # Team alerts and mentions
│   │   └── Settings.tsx        # Accessibility, display preferences, account info
│   ├── auth.tsx                # React Auth context & Firebase auth wrapper
│   ├── firebase.ts             # Firebase SDK setup with local cache & fallback config
│   ├── remote.ts               # Firestore data access layer & database queries
│   ├── store.tsx               # Global state manager (switching live vs. demo)
│   ├── data.ts                 # TypeScript interfaces and mock datasets
│   ├── ui.tsx                  # Reusable UI primitives (Buttons, Badges, Modals)
│   ├── App.tsx                 # Main layout shell and view router
│   ├── main.tsx                # Application entrypoint
│   └── index.css               # Tailwind CSS v4 configuration
├── firestore.rules             # Production database security rules
├── firestore.indexes.json      # Firestore query indexes
├── firebase.json               # Firebase Hosting and emulator configuration
└── package.json                # Project dependencies and script definitions
```

---

## 3. How to Run the Application

### Prerequisites
- [Node.js](https://nodejs.org/) (version 20 or higher recommended)
- `npm` (bundled with Node.js)

### Step 1: Clone or Navigate to the Project
```bash
cd c:\Users\hmalu\Documents\TaskMate
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment (Optional)
The application has built-in production fallbacks pointing to the `taskmate-hmb` Firebase project.

If you want to use your own Firebase project or local emulators, create a `.env.local` file:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Step 4: Start the Development Server
```bash
npm run dev
```
Open your browser and navigate to the printed URL (usually **`http://localhost:8443`** or **`http://localhost:5173`**).

---

## 4. Building & Deployment

### Build for Production
To test the production build locally:
```bash
npm run build
```
This compiles optimized assets into the `dist/` directory.

### Deploy to Firebase Hosting
To push the build directly to Firebase Hosting:
```bash
npx firebase-tools deploy --only hosting --project taskmate-hmb
```

### Deploy Firestore Security Rules
To update database access permissions:
```bash
npx firebase-tools deploy --only firestore:rules --project taskmate-hmb
```

---

## 5. Summary of Technologies

| Layer | Technology |
|---|---|
| Framework | React 19, Vite 8, TypeScript 5.7 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Backend & Auth | Firebase Authentication, Cloud Firestore |
| Hosting & CI/CD | Firebase Hosting, GitHub Actions |


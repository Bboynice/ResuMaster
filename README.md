# ResuMaster · AI-Powered Resume OS

Modern professionals expect more than a static template. ResuMaster combines a cinematic UI, AI-assisted writing, and Firestore-backed persistence to help candidates ship tailored, single-page resumes or cover letters in minutes.

![ResuMaster hero banner](./public/vite.svg)

<p align="center">
  <a href="#-core-features">Features</a> ·
  <a href="#-architecture-at-a-glance">Architecture</a> ·
  <a href="#-getting-started">Getting Started</a> ·
  <a href="#-environment">Environment</a> ·
  <a href="#-project-structure">Project Structure</a> ·
  <a href="#-roadmap--contributing">Roadmap</a>
</p>

---

## 🧠 Why ResuMaster?

- **Product-grade UX** – Fluid dashboards, tactile drag-and-drop editing, and export-ready typography powered by Tailwind & Framer Motion.
- **AI copilot** – GPT-powered layout generation, section rewrites, and tone control with graceful fallbacks when no API key is provided.
- **Realtime ownership** – Firestore-backed projects, demo mode for trials, and granular section state managed through typed React contexts.
- **Shipping focus** – Opinionated limits enforce one-page layouts, built-in PDF export, and theming controls so candidates can send assets immediately.

---

## ✨ Core Features

| Area | Highlights |
| --- | --- |
| Projects & Auth | Email/password auth, Firestore sync, demo mode seeds (`ProjectContext`) |
| Intelligent Editor | Section-level inline editing, multi-column layouts, drag/drop via `@dnd-kit` (`Editor.tsx`) |
| AI Automations | Layout generation, text rewrites, section upgrades with OpenAI or local mocks (`services/openai.ts`) |
| Styling System | Tailwind CSS + custom tokens, Radix UI primitives, Lucide iconography |
| Export & Sharing | Branded PDF export (`html2pdf.js`), font & background overrides, share-friendly defaults |

> UX note: The editor enforces 8-section resume / 6-section cover letter caps, mirroring real recruiter preferences and ensuring exports stay single-page.

---

## 🏗️ Architecture at a Glance

```
React 18 + Vite
├─ UI Shell: `AppLayout`, `Header`, `Sidebar`
├─ Pages: Dashboard, AllProjects, Editor, Templates, Auth flows
├─ Contexts: Auth, Projects, Sidebar, Theme
├─ Services: Firebase client, OpenAI client with mocks + validators
└─ UI Toolkit: Radix-based components, motion-powered cards, Tailwind tokens
```

- **State orchestration**: `ProjectProvider` streams Firestore docs or local demo data, manages optimistic updates, and enforces layout invariants (`src/contexts/ProjectContext.tsx`).
- **Editor ergonomics**: `Editor.tsx` coordinates drag sensors, AI prompts, section limits, inline typography, export modal, and PDF printing in one controlled surface.
- **AI service layer**: `services/openai.ts` encapsulates model prompts, hard caps section counts, sanitizes responses, and provides deterministic mocks for offline dev.

---

## 🧰 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Radix UI, Lucide, Framer Motion
- **State & Data**: React Context, Firebase Auth + Firestore, localStorage demo mode
- **AI & Export**: OpenAI Chat Completions (GPT-4.1 Nano), html2pdf.js
- **Build Tooling**: ESLint (flat config), PostCSS, pnpm/npm scripts

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- npm (or pnpm/yarn)
- Firebase project with Firestore + Email/Password auth
- OpenAI API key (optional; mocks cover local dev)

### Installation

```bash
git clone https://github.com/<you>/resumaster.git
cd resumaster
npm install
npm run dev
```

The Vite dev server prints a local + network URL. Log in with your Firebase credentials or trigger “Try Demo” to explore read-only data.

---

## 🔐 Environment

Create `/Users/illia/Documents/My Codes/resumaster/.env` and supply:

```env
# Firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# OpenAI (optional but required for live AI)
VITE_OPENAI_API_KEY=sk-...
```

> Production tip: the OpenAI SDK currently runs in-browser (`dangerouslyAllowBrowser: true`). Use a thin proxy before launching publicly.

---

## 💡 Usage Playbook

1. **Authenticate** – Email/password auth via Firebase; fallback demo mode seeds default projects.
2. **Create** – The dashboard’s `CreateProjectModal` scaffolds resumes or cover letters with template layouts.
3. **Edit** – The editor exposes inline text areas, multi-column splits, AI rewrite modals, font selectors, and drag handles.
4. **Automate** – Prompt the AI generator for a fresh layout or rewrite specific sections with tone guidance.
5. **Ship** – Export to PDF, tweak file naming, and share the single-page artifact with confidence.

---

## 📁 Project Structure

```
src/
├── components/
│   ├── Auth/            // Login & signup forms
│   ├── Dashboard/       // Cards, modals, analytics tiles
│   ├── Editor/          // EditableSection, SectionDropZone
│   ├── Layout/          // App shell, navigation chrome
│   └── ui/              // Radix-based atoms (buttons, cards, selects)
├── contexts/            // Auth, Project, Sidebar, Theme providers
├── pages/               // Route-level surfaces (Dashboard, Editor, Templates...)
├── services/            // Firebase + OpenAI integrations
├── types/               // Shared TypeScript contracts
└── utils/ & lib/        // Helper utilities and constants
```

---

## 📦 Available Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check & bundle for production |
| `npm run preview` | Preview the production build |
| `npm run lint` | Run ESLint across the repo |

---

## 🚢 Deployment

1. `npm run build` to emit the `dist` folder.
2. Deploy `dist/` to Netlify, Vercel, Firebase Hosting, or any static host.
3. Mirror environment variables in your hosting provider.
4. Configure SPA rewrites (`/* -> /index.html`) for client routing.

For Firebase Hosting:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

---

## 🔭 Roadmap & Contributing

- [ ] Collaborative editing with presence indicators
- [ ] Version snapshots per project
- [ ] Extended export formats (DOCX, PNG)

Contributions are welcome:

```bash
git checkout -b feature/amazing
git commit -m "Add amazing feature"
git push origin feature/amazing
```

---


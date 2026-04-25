https://taynazdev.github.io/VibesAI/

# VibesAI (Prism Ecosystem)

VibesAI is an AI-first app builder with a staged build workflow, live preview, and project persistence.

- Builder-first workflow with plan generation and step-by-step implementation.
- AI Chat experience with persisted history sessions.
- Projects library with resume, import/export, and preview support.
- Settings for OpenAI, OpenRouter, and Gemma provider keys/models.
- First-run onboarding flow for new users.

## Getting Started

### Prerequisites
- Node.js 20+ ([download here](https://nodejs.org/))
- A code editor (VS Code recommended)
- An API key from at least one provider:
  - [OpenAI](https://platform.openai.com/account/api-keys)
  - [OpenRouter](https://openrouter.ai/keys)
  - [Gemma](https://ai.google.dev/)

### Installation & Setup

1. **Clone the repository and install dependencies:**

```bash
git clone https://github.com/TaynazDev/VibesAI.git
cd VibesAI
npm install
```

2. **Start the development server:**

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. You'll see the splash screen on first load.

3. **Configure your AI provider:**
   - Click the **Settings** icon (⚙️) in the left dock
   - Select your AI provider (OpenAI, OpenRouter, or Gemma)
   - Paste your API key
   - Choose a model from the dropdown
   - Click "Save"

### Your First App Build

1. **Navigate to the Builder:**
   - Click the **Builder** icon (🎨) in the left dock, or
   - Select "New Project" → "Builder Session"

2. **Describe your app:**
   - In the **Plan** step, describe what app you want to build (e.g., "A todo list with drag-and-drop")
   - The AI generates a plan with features and approach
   - Review and click "Next Step" to proceed

3. **Build the prototype:**
   - In the **Prototype** step, the AI generates clean HTML + CSS + JavaScript
   - The live preview shows in real-time on the right
   - Use checkpoint saves to track versions

4. **Add functionality:**
   - In the **Functional** step, enhance the app with full interactivity
   - Ask for specific features in the chat input

5. **Polish the design:**
   - In the **Aesthetic** step, choose a visual direction
   - The AI proposes 3 design options; pick one or provide a custom direction

6. **Final touches:**
   - In the **Polish** step, make final refinements and optimizations

### Using AI Chat

1. Click the **AI Chat** icon (💬) in the dock
2. Type your prompt and press Enter or click the send button (⭕)
3. Chat history is saved automatically
4. Switch between conversations using the dropdown at the top-right

### Analytics & Quality Checks

1. **View usage stats:**
   - Click the **Settings** icon, then select "Analytics" from the menu
   - See token usage, cost trends, and per-model breakdowns
   - Export data as CSV or JSON

2. **Run an AI Critic pass:**
   - In the Builder preview, click the **🤖 Critic** button
   - Get scores for UX, Accessibility, and Performance
   - Review identified issues and suggestions

3. **Check release readiness:**
   - Click the **📊 Release** button in the Builder
   - View overall readiness score and critical blockers
   - Dashboard shows when your app is ready to ship

4. **Time travel through snapshots:**
   - Click the **⏱ Time Travel** button to see all project snapshots
   - Snapshots are auto-created on every code generation
   - Click "Restore" to revert to any previous version

### Managing Projects

1. **Save a project:**
   - Built projects auto-save to the Projects library
   - Access via the **Projects** icon (📁) in the dock

2. **Export your project:**
   - Open a project detail view
   - Click "Export" to download as `.vibesai.json` (full project) or `.html` (preview)

3. **Import a project:**
   - Click the **+** button in the Projects toolbar
   - Select "Import Project" and choose a `.vibesai.json` file

### Build for Production

```bash
npm run build
```

Output is in the `dist/` folder. Deploy to any static hosting:
- GitHub Pages (automated via workflow)
- Vercel
- Netlify
- Any S3-compatible storage

### Tech Stack

- **React 18** + TypeScript + Vite
- **React Router** for navigation
- **Recharts** for analytics visualizations
- **Web Audio API** for voice input visualization
- **SpeechRecognition API** for voice-to-text

## Core Features

- App Maker stages:
	- Plan
	- Prototype
	- Functional pass
	- Aesthetic pass
	- Final polish
- Live iframe preview with manual reload control.
- Builder checkpoint saves and stage history.
- AI Chat:
	- Uses any configured provider key from Settings.
	- Saves conversations in a top-right history dropdown.
- Auto-save builder state into Projects for later resume.
- Notifications, account profile, and settings dashboards.

## First-Run Onboarding

- New users see onboarding once after splash.
- Completion is persisted in localStorage with `va_onboarding_done`.

## Deploy To GitHub Pages

- Deployment uses the workflow in `.github/workflows/deploy-gh-pages.yml`.
- The app builds to `dist/` and publishes via GitHub Actions Pages.
- `base` is set dynamically:
	- GitHub Actions builds: `/VibesAI/`
	- Local builds: `/`

## Local Static Preview (Live Server)

- Do not serve the repository root `index.html` directly for app runtime tests.
- Build first, then serve `dist/index.html`.
- For normal development, use `npm run dev`.

## Troubleshooting White Screen

- If GitHub Pages is white:
	- Ensure Pages source is set to GitHub Actions.
	- Confirm latest deployment workflow succeeded.
	- Hard-refresh browser cache.
- If Live Server is white:
	- Serve `dist/`, not root source entry.

## Current Implementation Status

- App shell and glassmorphic design system: implemented.
- Builder and AI chat core flows: implemented.
- Projects and notifications center: implemented with persistence.
- Settings/account surfaces: implemented.
- Backend/API integrations: pending.

## Branding Assets

Place your provided logos in these exact paths:

- public/branding/prism-suite-logo.png
- public/branding/vibesai-logo-light.jpg
- public/branding/vibesai-logo-dark.jpg

Behavior:

- VibesAI logo auto switches with system light and dark mode.
- Prism suite logo is used for ecosystem signature surfaces.

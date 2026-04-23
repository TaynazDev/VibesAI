# VibesAI — Roadmap & Ideas

This file tracks planned features, coming-soon items, and unused ideas.
Features shown greyed-out in the app UI are listed here with implementation notes.

---

## 🟡 Coming Soon (shown in UI, not yet built)

### 🧠 Memory & Context
Long-term memory across sessions. Store user preferences, past project styles, tone preferences.
- Likely: vector store (e.g. Pinecone or OpenAI file search) per user
- Could use `localStorage` for a lightweight client-only version first
- Needs: settings toggle to enable/clear memory

### 🔗 App Integrations
Connect VibesAI to third-party tools.
- Notion: push AI output directly to a page
- GitHub: create issues, PRs, or code review comments
- Figma: generate copy or alt text into a frame
- Slack: run prompts from a slash command
- Needs: OAuth flow, webhook endpoints, settings page per integration

### 🎙️ Voice Input
Real-time speech-to-text into the prompt composer.
- Use OpenAI Whisper API (`/audio/transcriptions`) or browser `SpeechRecognition`
- Mic button in the bar-footer, live transcript displayed as user types
- Needs: browser permission handling, visual waveform feedback

### 🤖 Custom AI Agents
Build and save reusable agents with a system prompt, tools, tone, and persona.
- Agent builder page (new route `/agents`)
- Stored in app state + localStorage
- Each agent selectable from the composer mode chips
- Needs: agent CRUD UI, agent picker in composer, system prompt injection into `aiService.ts`

### 📂 File & Doc Analysis
Upload PDFs, images, spreadsheets, or code files.
- Use OpenAI file uploads + assistants API for document Q&A
- Code: send file content as user message context
- Images: already partially supported via DALL·E — extend to GPT-4o vision
- Needs: drag-and-drop zone in composer, file preview, file-aware prompt building

### ✏️ Inline Editor
Highlight text anywhere and run AI on the selection.
- "AI Lens" floating toolbar on text selection (similar to Notion AI)
- Actions: Rewrite, Expand, Shorten, Translate, Fix grammar
- Needs: global `selectionchange` listener, floating toolbar component, action dispatch

### 🎨 Image Editing
Edit generated or uploaded images.
- Inpainting: mask regions and regenerate with DALL·E edits endpoint
- Outpainting: extend canvas
- Style transfer: describe a new style and re-apply
- Needs: canvas component, mask drawing tool, DALL·E edits/variations API calls

### 📊 Analytics Dashboard
Usage stats and cost tracking.
- Token usage per request (from OpenAI API response `usage` field)
- Cumulative cost estimate (based on model pricing)
- Chart: requests over time, mode breakdown, avg prompt length
- Needs: persist usage in state/localStorage, charting library (e.g. Recharts), `/analytics` route

### 🔒 Team Workspaces
Multi-user support.
- Invite team members by email
- Shared prompt library across the team
- Role-based API key management
- Needs: backend (auth, DB), currently fully client-side — this is a larger scope item

### ⚡ Prompt Library
Save and reuse prompts.
- Save any run to the library with a name + tags
- Browse/search saved prompts
- One-click to load a saved prompt into the composer
- Needs: `prompts` slice in app state, `/library` route, tag filter UI

---

## 💡 Unused Ideas / Backlog

> Ideas that haven't been added to the UI yet. Add freely.

- **Diff view** — when Refactor mode returns output, show a side-by-side before/after diff
- **Streaming responses** — stream GPT output token by token instead of waiting for the full response
- **Multiple models** — let users pick GPT-4o, GPT-4o-mini, Claude, Gemini from a model picker
- **Export** — download result as .txt, .md, .docx, or copy as rich text
- **Dark/light branded export cards** — generate a shareable image card of the result
- **Mobile app** — React Native or Capacitor wrapper around this PWA
- **Keyboard command palette** — `Cmd+K` opens a Raycast-style command palette for all actions
- **Prompt versioning** — track edits to a prompt over time, restore previous versions
- **Collaborative sessions** — real-time co-editing of a prompt with another user (WebSocket)
- **AI on notifications** — summarise all unread notifications in one click
- **Project-scoped context** — each Project can have its own system prompt, style guide, and history
- **Plugin system** — allow third-party plugins to add new AI modes or result renderers

---

## ✅ Implemented

- Real OpenAI integration (GPT-4o-mini text, DALL·E 3 images)
- ChatGPT-style auto-expanding composer with mode chips
- Light / Dark / System theme with pink (dark) and blue (light) accents
- Liquid glass UI (visionOS-style blur + specular)
- Arc dial navigation dock
- Splash screen with 3D press animation, theme-aware logo
- Persistent settings via localStorage
- Notification system
- Projects page (empty, ready for data)
- Account page

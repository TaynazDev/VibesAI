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

- **Deploy to Web / App Store** — after the builder workflow finishes, let users publish their generated app directly
  - Web deploy: upload the HTML file to a hosting provider (Netlify/Vercel via API, or GitHub Pages) and return a live URL
  - Progressive Web App: inject a service worker + manifest into the generated HTML so it can be "installed" from a browser
  - Mobile App Store: wrap the generated app in Capacitor/Cordova, build signed APK/IPA, upload to Google Play (via Burstable API) and App Store Connect (via App Store Connect API)
  - Needs: server-side function to proxy deployment APIs (keys shouldn't be client-side), per-app domain/subdomain system, optional custom domain support

- **Arc dial dock** — The left nav pill becomes a physical dial: the active item protrudes furthest right, items above/below curve back using cosine-based pullback. Navigating animates all items to new arc positions (spring easing). Feels like rotating a real dial.
  - Implementation: `useLocation` + index-based offset, `cos(offset * ARC_STEP)` for x-pull, `offset * ITEM_GAP` for y-offset, `transform: translate(xPull, yOffset)` on each button, spring transition `cubic-bezier(0.34, 1.56, 0.64, 1)`. The pill background is pushed `left: -58px` so only its right curved edge is visible.
  - Was partially implemented and reverted — see commit `f6bc5bd`

- **Express Mode (1-stage builder)** — Add a mode switch in the top-right corner that runs a single fast stage from one prompt.
  - Flow: user enters one prompt → AI plans, functionalises, and designs in one run → user is taken to an **Edit** page.
  - Edit page: user can ask AI for targeted changes, AI returns proactive edit suggestions, and the page keeps a live preview.
  - Output: include a prominent final download button after edits are complete.
  - Needs: mode toggle UI (Standard vs Express), express pipeline prompt template, new `/edit` route, shared checkpoint/history model so Express edits still save to Projects.

- **AI Critic Pass** — after each generation, run a second AI pass that scores UX clarity, visual hierarchy, accessibility, and performance with one-click fixes.
- **Brand DNA Presets** — save reusable brand packs (colors, type, spacing, voice) and apply them instantly in builder and edit flows.
- **Competitive Clone Mode** — paste a URL and let AI recreate an inspired, legally clean version of layout + interaction patterns.
- **User Journey Simulator** — AI simulates multiple personas and reports friction points before export.
- **Component Locking** — lock specific sections so later AI edits cannot modify them unless unlocked.
- **Time Travel Editor** — visual timeline of major changes with preview snapshots and instant rollback.
- **Mobile-First Toggle** — one switch that prioritizes touch targets, mobile nav, and compact responsive spacing.
- **Prompt-to-Database Schema** — derive entities, fields, and relationships from the app prompt.
- **Built-In Analytics Starter** — auto-inject event tracking scaffolding into generated apps.
- **Collaboration Review Links** — share preview links where teammates can comment directly on UI elements.
- **Conversion Mode** — design pass focused on landing-page conversion structure and persuasive CTA flow.
- **Accessibility Hardening Mode** — one-click WCAG pass (contrast, focus, semantic structure, keyboard flow).
- **Smart Naming Pass** — auto-rename sections/components/classes into clean semantic names.
- **Auto Changelog** — every generation/edit creates a human-readable change summary.
- **Template Marketplace** — community templates and prompt blueprints users can fork in one click.
- **Voice-to-App Mode** — speak your app idea and refinements with real-time prompt cleanup before generation.
- **Screenshot-to-UI Rebuild** — upload a screenshot and have AI recreate the interface as editable code.
- **Business Logic Wizard** — guided setup for pricing rules, permissions, workflows, and validation.
- **AI QA Test Generator** — auto-create test scenarios and click paths before export.
- **Prompt Cost Estimator** — show token/cost estimate pre-run and suggest cheaper model alternatives.
- **Undo Intent (Natural Language)** — commands like "undo just the typography change" for scoped rollback.
- **Persona-Based Style Packs** — presets like Startup SaaS, Luxury Brand, and Creator Economy.
- **Data Seeder** — generate realistic mock data for dashboards, lists, and forms.
- **API Connection Mapper** — scaffold endpoint wiring, auth, loading states, and error handling from a short brief.
- **Compliance Guardrails** — optional GDPR/accessibility/compliance-friendly defaults and copy.
- **Multi-Page App Map** — AI proposes sitemap/routes first, then builds page-by-page with shared components.
- **Release Readiness Score** — final pre-download checklist + score for UX, a11y, responsive, and performance.

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

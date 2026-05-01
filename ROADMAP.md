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

### 🔒 Team Workspaces
Multi-user support.
- Invite team members by email
- Shared prompt library across the team
- Role-based API key management
- Needs: backend (auth, DB), currently fully client-side — this is a larger scope item

---

## 💡 Unused Ideas / Backlog

> Ideas that haven't been added to the UI yet. Add freely.

### 🚀 Priority Feature Drops (added 2026-04-26)

- **Screenshot-to-app** *(Killer feature)*
  - User uploads a screenshot/photo of any UI (napkin sketch, competitor app, Figma frame) and VibesAI recreates it as working code.
  - Suggested approach: Claude vision + structured UI extraction + code generation pass + editable component output.
  - How to build this ↗: add image upload entry point in Builder, run vision-to-layout parser, map to component primitives, then run a refinement pass.

- **Multiplayer / collab mode** *(V2 feature)*
  - Two people in the same project, both typing prompts, watching preview updates live (Google Docs-style vibe-coding).
  - Suggested sync layer: Supabase Realtime or Liveblocks.
  - First milestone: presence + shared prompt timeline + conflict-safe project state merges.

- **VibesAI marketplace** *(Monetization unlock)*
  - Users sell deployed apps/templates to other VibesAI users.
  - Seller receives revenue share; buyer gets one-tap clone into workspace.
  - Plan this out ↗: listing model, moderation/review flow, payments + payout rails, licensing and clone attribution.

- **AI component library** *(V1 stretch goal)*
  - Let users build a personal reusable component library (nav bars, cards, modals) that future prompts can reference.
  - Core UX: "Use my card component" and "save this block to my library".
  - First milestone: component save/extract + tagging + retrieval in prompt context.

- **Prompt history & favourites** *(Easy win)*
  - Save every prompt ever typed, allow starring best prompts, reuse across projects, and share prompt packs.
  - Product angle: prompts become reusable assets users care about.
  - First milestone: history timeline + favorites filter + one-click re-run.

- **Export to GitHub** *(Indie dev magnet)*
  - One tap creates a new GitHub repo, commits generated code, and pushes.
  - Bridges vibe-coding to real developer workflow.
  - First milestone: GitHub OAuth + repo create + initial commit + push + success URL handoff.

### 🔴 Now

- **VibesAI Visual Identity Pass** — refine this app's own look to feel more premium and distinct.
  - Improve left-side/nav readability and hierarchy while keeping the signature look keep the most relevant in the middle and as you go down or up the list the items get less relevant. This way it guides the eye to the most important items first.
  - Tighten spacing rhythm and panel balance across Builder, Projects, Settings, and Account.
  - Add cohesive motion language (entry transitions, state changes, and feedback timing).
- **Aesthetic Presets for VibesAI UI** — switchable in-app skins for this product itself (not generated apps), e.g. Glass Neon, Editorial Soft, Minimal Mono.
- **Design QA for VibesAI Surfaces** — checklist + automated pass for contrast, visual consistency, and mobile polish of this app's own interface.
- **Brand DNA Presets** — reusable brand packs (color, type, spacing, voice).
- **Aesthetic Direction Generator** — AI proposes 3 distinct visual directions (plus custom) before applying design changes.
- **Theme Mixer** — blend two styles (e.g., "neo brutalist + glass") with adjustable intensity sliders.
- **Visual Consistency Pass** — normalize spacing, radius, type scale, icon style, and shadow language across all screens.
- **Dark/light branded export cards** — social-ready share cards.
- **Export** — richer download formats (.txt/.md/.docx) and rich-copy support.
- **Smart Naming Pass** — semantic rename pass for sections/components/classes.
- **Motion Design Pass** — apply purposeful micro-interactions, page transitions, and staggered reveals with timing controls.
- **Color System Studio** — generate semantic palettes (primary/success/warn/error/surface states) with contrast validation.
- **AI Conversation Mode** — multi-turn back-and-forth with the AI, with memory and context, to design your app.
- **Voice-to-App Mode** — voice-first prompt/refinement workflow.
- **Prompt Cost Estimator** — pre-run cost forecast + cheaper model suggestions.

### 🟠 Next

- **Component Locking** — lock sections so AI can't change protected blocks.
- **Business Logic Wizard** — guided setup for rules, permissions, workflows.
- **Prompt-to-Database Schema** — derive entities and relations from prompt.
- **API Connection Mapper** — scaffold endpoint wiring + loading/error/auth states.
- **Data Seeder** — realistic mock datasets for generated apps.
- **Built-In Analytics Starter** — inject event tracking scaffolding.
- **Accessibility Hardening Mode** — one-click WCAG-focused cleanup pass.
- **Multi-Page App Map** — route-first generation flow.
- **Project-scoped context** — per-project system prompt, style guide, and memory.

### 🟢 Later

- **Deploy to Web / App Store** — publish generated apps directly from the builder.
  - Web deploy: Netlify/Vercel/GitHub Pages upload and return live URL.
  - Progressive Web App: inject service worker + manifest.
  - Mobile App Store: Capacitor/Cordova wrapper and store upload pipeline.
  - Needs: server-side deployment proxy, domain mapping, optional custom domains.
  - **Competitive Clone Mode** — inspired layout/interaction recreation from URLs.
- **User Journey Simulator** — persona-based friction analysis.
- **Collaboration Review Links** — comment-on-preview collaboration links.
- **Persona-Based Style Packs** — predefined vertical-specific style archetypes.
- **Design Tokens Export** — export full theme tokens (CSS vars / JSON) for reuse across projects.
- **Typography Pairing Engine** — AI suggests and applies balanced heading/body font pairs per brand tone.
- **Layout Rhythm Optimizer** — auto-tune section spacing and grid rhythm for cleaner visual flow.
- **Compliance Guardrails** — GDPR/accessibility/compliance defaults.
- **AI QA Test Generator** — auto-generate QA scenarios and click paths.
- **Undo Intent (Natural Language)** — scoped rollback commands in plain language.
- **Conversion Mode** — conversion-focused design/copy pass for landing funnels.
- **Multiple models** — broader model picker across providers.
- **AI on notifications** — summarize unread notifications in one action.
- **Auto Changelog** — user-facing changelog auto-generated after each pass.
- **Keyboard command palette** — `Cmd+K` command surface.
- **Prompt versioning** — restore previous prompt versions.
- **Plugin system** — third-party AI modes/result renderers.
- **Arc dial dock** — physical dial-style left nav (kept as visual experiment backlog).
- **Mobile app** — React Native/Capacitor wrapper for native distribution.

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
- Prompt Library (`/library`) with save/search/filter/delete and one-click load into AI Chat
- Express Mode (Standard vs Express toggle, 2-step plan + finishing-touches flow)
- Projects page with persistence, exports/imports, and builder resume
- Account page
- Onboarding page for first-time users
- Home button reset (re-click clears builder to fresh start, project stays saved)
- **Diff view** — before/after code diff in the builder preview panel (toggle ⊟ Diff button)
- **Streaming responses** — live token streaming with partial message preview and blinking cursor
- **Speech-to-Text** — mic button in builder and AI Chat inputs using browser SpeechRecognition API
- **Usage Analytics Dashboard** — `/analytics` route with charts, filters, model breakdown, CSV/JSON export
- **AI Critic Pass** — modal scoring UX/A11y/Performance with issue surfacing
- **Time Travel Snapshots** — snapshot creation, restore, and delete for builder states
- **Release Readiness Score** — readiness modal with overall score and deployment signal
- **Visual Polish Pass** — UI refinement suggestions and polish scoring in builder

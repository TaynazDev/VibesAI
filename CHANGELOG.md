# Changelog

All notable changes to VibesAI are documented in this file.

## 2026-04-25

### Added
- **Usage Analytics Dashboard** (`/analytics` route):
  - Interactive charts (cost timeline, model usage, request distribution)
  - Time range filtering (Today, Week, Month, All-time)
  - Key metrics display (total requests, tokens, cost, avg cost per request)
  - Detailed model breakdown table
  - CSV and JSON export functionality
- **AI Critic Pass Modal**:
  - One-click UX, Accessibility, and Performance scoring
  - Issue detection with severity badges (critical/warning/info)
  - Color-coded score display and improvement suggestions
  - Accessible from Builder preview toolbar via 🤖 Critic button
- **Time Travel Snapshot System**:
  - Auto-snapshot creation on every code generation
  - Side panel showing all project snapshots with timestamps
  - One-click restore to any previous version
  - Snapshot deletion for cleanup
  - Accessible from Builder via ⏱ Time Travel button
- **Release Readiness Modal**:
  - Overall readiness score visualization (0-100%)
  - Status indicators (Ready/Review Needed/Not Ready)
  - Category-based quality checks (UX/A11y/Performance/Critical Issues)
  - Issue severity display and deployment readiness
  - Accessible from Builder via 📊 Release button
- Added **recharts** dependency for interactive analytics visualizations
- Extended AppContext with new types: `UsageRecord`, `Snapshot`, `CriticScore`
- New state management actions: `USAGE_ADD`, `SNAPSHOT_*`, `CRITIC_SCORE_ADD`
- New hooks: `useUsage()`, `useSnapshots()`, `useCriticScores()`

### Changed
- README now includes comprehensive getting-started tutorial with step-by-step guides
- Voice input animation improvements:
  - Bars now animate smoothly from 0.15-1.5 scale range
  - Center-outward mirroring effect for visual hierarchy
  - Silent state now shows tiny dots (0.15 scale) instead of dashes
  - Microphone only activates during active listening
  - Splash screen shows on browser reopen (sessionStorage-based)

## 2026-04-23

### Added
- New `Coming Soon` page and route, plus sidebar entry.
- Builder project persistence model (`project.builder`) with saved plan, code, checkpoints, and step history.
- Builder session resume route (`/builder/:id`) and recent session picker.
- AI Chat sidebar page at the top of the dock stack (`/ai-chat`).
- First-run onboarding page that appears after splash to explain the core workflow (Builder, AI Chat, Projects, Settings, exports).
- AI Chat session history persistence with a top-right dropdown switcher and `New chat` action.
- GitHub Pages deployment workflow via GitHub Actions (`.github/workflows/deploy-gh-pages.yml`).
- Project export/import support:
  - Export full project package as `.vibesai.json`
  - Export generated preview as `.html`
  - Import project package from JSON
- Project detail enhancements:
  - Builder snapshot summary
  - Live preview panel
  - Resume builder shortcut
- Notification improvements:
  - Search
  - Kind filters (all, unread, builder, project, system)
  - Delete notification action
  - Clear-read action
  - Kind tagging for builder and project events
- Settings enhancements:
  - Provider readiness dashboard
  - Workspace data actions
  - Curated OpenRouter model selector split into `Free Models` and `Paid Models`
- Account page enhancements:
  - Profile hero block
  - Role, studio, and creative focus fields
  - Workspace summary cards
- Stage-4 aesthetics selector in app maker:
  - AI proposes 3 aesthetic options
  - Fourth option via user-provided `Something else`
  - Aesthetic is applied after explicit selection

### Changed
- Dock layout adjusted:
  - Home centered in the dial
  - Added `Soon` nav item
  - Slightly reduced dial button sizes
- Builder generation behavior:
  - In-flight stage generation now survives navigation to other pages and persists its result back into the builder session.
  - Moving to another builder stage now cancels the in-flight generation for the previous stage.
- Builder preview now includes a manual `Reload` control to re-render the live iframe on demand.
- AI Chat page now behaves as a conversational chat (message/response thread) rather than single-run output cards.
- AI Chat provider behavior now falls back across configured keys (OpenAI/OpenRouter/Gemma) so chat can run with any available key from Settings.
- Removed the `Coming soon` section from the AI Chat page.
- AI Chat layout refined for a minimal aesthetic:
  - Removed boxed chat-window panel treatment so messages render in open space.
  - Starter suggestions now sit directly above the input bar.
  - Input bar styling softened to feel lighter while preserving usability.
- App launch flow now gates first-time users through onboarding once before entering the main workspace.
- Vite base-path handling is now environment-aware for hosting:
  - GitHub Actions builds use `/VibesAI/` for GitHub Pages.
  - Local builds use `/` to avoid white-screen static preview issues.
- Splash screen button shadow now supports gyro-based parallax on capable devices.
- Tab icon and `theme-color` now sync to active theme at app level.
- Builder suggestions are now shown only for stages 3, 4, and 5.
- Projects page moved to builder-first workflow (manual "New Project" button removed).
- ROADMAP backlog expanded with major feature ideation (Express Mode and additional future ideas).

### Notes
- Browser security still limits direct silent write access to an OS folder. Current workflow uses explicit import/export and local persistence.

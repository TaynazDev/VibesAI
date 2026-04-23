# Changelog

All notable changes to VibesAI are documented in this file.

## 2026-04-23

### Added
- New `Coming Soon` page and route, plus sidebar entry.
- Builder project persistence model (`project.builder`) with saved plan, code, checkpoints, and step history.
- Builder session resume route (`/builder/:id`) and recent session picker.
- AI Chat sidebar page at the top of the dock stack (`/ai-chat`).
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
- Removed the `Coming soon` section from the AI Chat page.
- Splash screen button shadow now supports gyro-based parallax on capable devices.
- Tab icon and `theme-color` now sync to active theme at app level.
- Builder suggestions are now shown only for stages 3, 4, and 5.
- Projects page moved to builder-first workflow (manual "New Project" button removed).
- ROADMAP backlog expanded with major feature ideation (Express Mode and additional future ideas).

### Notes
- Browser security still limits direct silent write access to an OS folder. Current workflow uses explicit import/export and local persistence.

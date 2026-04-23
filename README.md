https://taynazdev.github.io/VibesAI/

# VibesAI (Prism Ecosystem)

VibesAI is an AI-first app builder with a staged build workflow, live preview, and project persistence.

- Builder-first workflow with plan generation and step-by-step implementation.
- AI Chat experience with persisted history sessions.
- Projects library with resume, import/export, and preview support.
- Settings for OpenAI, OpenRouter, and Gemma provider keys/models.
- First-run onboarding flow for new users.

## Tech Stack

- React + TypeScript + Vite
- React Router

## Run Locally

1. Install Node.js 20+ from the official website.
2. Install dependencies:

```bash
npm install
```

3. Start dev server:

```bash
npm run dev
```

4. Build production bundle:

```bash
npm run build
```

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

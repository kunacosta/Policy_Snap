# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This App Does

**PolicySnap** (by Onyxx Tech) is an insurance policy summary poster generator. The workflow:
1. User enters their agent name and copies a structured extraction prompt
2. User pastes that prompt into NotebookLM (along with an uploaded insurance PDF)
3. User pastes NotebookLM's JSON response back into the app
4. The app renders a clean A4 "policy summary poster" that can be downloaded as PDF, printed, or shared via WhatsApp

There is **no direct PDF parsing or AI API call** in the app itself — the AI extraction is offloaded to the user via NotebookLM.

## Commands

```bash
# Web development server (localhost:3000)
npm run dev

# Lint
npm run lint

# Build (Next.js standalone output — required before Electron packaging)
npm run build

# Electron desktop app (dev — requires `npm run dev` running separately on port 3456)
npm run electron:dev

# Electron Windows installer (runs Next.js build + electron-builder)
npm run electron:build

# Android APK via Capacitor
npm run mobile:build       # builds Next.js static export + runs Capacitor sync
npm run mobile:sync        # alias: build then cap sync android
npm run mobile:open        # open Android Studio
```

## Architecture

### Deployment Targets

The app ships on **three platforms** with different Next.js output modes:

| Target | Config | Output Mode |
|--------|--------|-------------|
| Web / dev | `next.config.mjs` | `standalone` (server-side) |
| Electron desktop | `next.config.mjs` | `standalone` — packaged by `scripts/build.js` + electron-builder |
| Android (Capacitor) | `next.config.mobile.mjs` | `export` (static, no server) |

For mobile builds, `scripts/mobile-build.js` swaps in `next.config.mobile.mjs` before running the export.

### Electron Architecture

`electron/main.js` spawns the Next.js standalone server as a child process on port **3456**, then opens a `BrowserWindow` that points to `http://127.0.0.1:3456`. In production (packaged), the server bundle lives in `resources/server/` and is launched using the Electron binary itself with `ELECTRON_RUN_AS_NODE=1`. A splash screen (`electron/splash.html`) is shown while waiting for the server.

### Page Flow

- **`/` (`src/app/page.tsx`)** — Upload/input page. Contains the hardcoded `NOTEBOOKLM_PROMPT` string. Parses pasted JSON, stores `policyData` and `agentName` in `sessionStorage`, then navigates to `/poster`.
- **`/poster` (`src/app/poster/page.tsx`)** — Reads from `sessionStorage`, renders the poster, and handles all export actions (PDF via jsPDF, WhatsApp share, print). On mobile (Capacitor), uses `@capacitor/filesystem` + `@capacitor/share` for native file sharing instead of browser download.

### Key Component: `PolicyDocument`

`src/components/PolicyDocument.tsx` renders the A4 poster as a pure React component with **inline styles only** (no Tailwind). It uses three ref layers in the poster page to handle display scaling vs. full-resolution capture:
- `outerRef` — clipping container sized to the scaled dimensions
- `scaleRef` — carries the CSS `transform: scale()` for visual display
- `documentRef` — the actual 794px-wide A4 document passed to `html2canvas`

Before `html2canvas` capture, the scale transform is temporarily removed so the captured image is always at full resolution (scale: 3×).

Inline editing works via `contentEditable` spans (`EditableSpan` component). Field paths use dot notation: `coverageItems.0.name`, `keyBenefits.2`, etc.

### Data Type

All policy data flows through the `PolicyData` interface (`src/types/policy.ts`). All string fields are `string | null` — the `val()` helper in `PolicyDocument` falls back to `'N/A'` for display.

### Styling

- App shell (dark UI): CSS custom properties defined in `globals.css` (`--bg`, `--green`, `--border`, etc.)
- Poster document: inline styles only, using constants `NAVY = '#1A2E4A'` and `GREEN = '#1D9E75'`
- Print styles: `.no-print` class hides the action bar; a second `<PolicyDocument>` render in `print:block` ensures clean printed output
- Font: DM Sans loaded via `next/font` in `layout.tsx`

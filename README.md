# PolicySnap

**A free tool that turns a complicated insurance policy PDF into a clean, one-page summary poster — in about a minute.**

Built by **Onyxx Tech** for insurance agents in Malaysia who want to give their clients something easier to read than a 60-page policy document.

---

## Table of Contents

- [What PolicySnap Does](#what-policysnap-does)
- [Who It's For](#who-its-for)
- [What You Can Do With It](#what-you-can-do-with-it)
- [How To Use It (Step-by-Step)](#how-to-use-it-step-by-step)
- [Comparing Two Policies](#comparing-two-policies)
- [Editing the Poster](#editing-the-poster)
- [Saving, Sharing, and Printing](#saving-sharing-and-printing)
- [Where to Get the App](#where-to-get-the-app)
- [Building From Source (Developers)](#building-from-source-developers)
- [Project Structure](#project-structure)
- [Common Issues](#common-issues)
- [Contact](#contact)

---

## What PolicySnap Does

Insurance policies are long. A typical Malaysian life or medical policy document is 30–80 pages of small print, legal language, and tables that most clients never read.

PolicySnap solves this by generating a **single-page A4 "policy summary poster"** that shows the customer:

- Who is insured, policy number, insurer
- Sum assured, annual premium, effective and expiry dates
- A clear list of every coverage / rider with its limit and what it actually means
- Key benefits and exclusions in plain English
- Claims hotline, waiting period, and how to claim
- The agent's name and contact

It can also **compare two policies side-by-side**, so when a client is deciding between two plans (or considering switching insurers), the agent can show the differences at a glance.

### How the AI works

PolicySnap does not run an AI model itself. Instead, it uses **NotebookLM** (Google's free document AI). You upload the insurance PDF to NotebookLM, paste a prompt that PolicySnap gives you, and NotebookLM extracts all the policy details as structured JSON. You paste that JSON back into PolicySnap and it draws the poster.

**Why this design?**

- No expensive AI API costs
- The data extraction is auditable — you can see exactly what NotebookLM read
- It works offline once the JSON is in
- No customer data ever leaves your laptop except the original PDF you upload to NotebookLM

> **Glossary:** *NotebookLM* is a free document-reading AI by Google. *JSON* is a plain-text format that looks like `{ "name": "value" }` — you don't need to read it, just copy and paste.

---

## Who It's For

- **Insurance agents** who want a professional client-facing summary
- **Financial planners** comparing plans for clients
- **Brokers** who need to show policy differences across insurers

Designed for the Malaysian market — currency in RM, dates in DD/MM/YYYY, insurers like Allianz, AIA, Great Eastern, Tokio Marine, Prudential, Manulife, etc.

---

## What You Can Do With It

| Feature | What it means |
|---|---|
| One-page poster generation | Turn any policy PDF into an A4 summary |
| Side-by-side comparison | Generate a comparison poster between two policies |
| AI-extracted data | NotebookLM reads the PDF for you |
| Inline editing | Tap any field on the poster to edit it before exporting |
| PDF export | Download as a print-ready A4 PDF with safe margins for any printer |
| WhatsApp share | One-tap share to clients (works on Android natively) |
| Print direct | Open the system print dialog with one click |
| Native scroll & zoom | Scroll the poster naturally; pinch to zoom on mobile, Ctrl+wheel on desktop |
| Works offline | No internet needed once the JSON is in |
| Three platforms | Web, Android APK, and Windows desktop installer |

---

## How To Use It (Step-by-Step)

Whether you use the website, the Android app, or the Windows desktop app, the workflow is identical.

### Step 1 — Open PolicySnap

Open the app (or visit the website). You'll see a black home page that says **PolicySnap** at the top.

### Step 2 — Enter your name

Type your name into the **"Agent Name"** box. This name will appear on the poster as *"Prepared by: [Your Name]"*.

### Step 3 — Copy the prompt

Click the **"Copy Prompt"** button. PolicySnap copies a long instruction text to your clipboard. (You don't need to read it — it's instructions for NotebookLM.)

### Step 4 — Go to NotebookLM

Open [notebooklm.google.com](https://notebooklm.google.com) (free, just sign in with Google).

1. Click **"Create new notebook"**
2. Upload the customer's insurance policy PDF as a source
3. Wait for NotebookLM to finish processing it (usually 10–30 seconds)
4. In the chat box, **paste the prompt** you copied from PolicySnap
5. Press Enter

NotebookLM will respond with a block of JSON that looks like `{ "insurerName": "...", "policyNumber": "...", ... }`.

### Step 5 — Copy the JSON

Copy NotebookLM's entire JSON response.

> **Tip:** If NotebookLM wraps the JSON in triple backticks (```), copy everything *including* the backticks — PolicySnap handles both.

### Step 6 — Paste into PolicySnap

Back in PolicySnap, paste the JSON into the big text box and click **"Generate Poster"**.

The app validates the JSON. If anything is missing or malformed, you'll see a clear error telling you what to fix.

### Step 7 — Your poster is ready

PolicySnap takes you to the poster view. You can now scroll around, zoom, edit, and export.

---

## Comparing Two Policies

PolicySnap can put two policies on the same page for a side-by-side decision view.

1. From the home page, click **"Compare Two Policies"**
2. You'll see two prompts side-by-side — one for Policy A, one for Policy B
3. Copy each prompt and run them in two separate NotebookLM notebooks (one PDF per notebook)
4. Paste both JSON responses back into the two boxes
5. Click **"Generate Comparison"**

The comparison poster shows both policies in two columns, with matching coverage items aligned so the client can immediately see *"Plan A gives me RM200 daily hospital cash, Plan B gives me RM150"* — for every benefit.

There's also a **Verdict View** that summarises which plan wins on which category (better coverage / lower premium / etc.).

---

## Editing the Poster

Sometimes NotebookLM gets a detail slightly wrong, or you want to tweak the wording.

1. On the poster page, click the **pencil icon** (top toolbar)
2. Every field on the poster becomes editable — click on it and type
3. Click the pencil icon again to exit edit mode

> The Onyxx Tech logo cannot be edited or removed. This is intentional.

Your edits are saved automatically in the browser. If you close the tab and come back, your draft is still there.

---

## Saving, Sharing, and Printing

In the top toolbar of the poster page:

| Button | What it does |
|---|---|
| **Download** (file icon) | Saves the poster as a high-resolution A4 PDF. On Android, it goes to your Downloads folder. On desktop/web, it downloads via the browser. |
| **WhatsApp** (green icon) | Opens WhatsApp's share sheet with the poster as a PNG image, ready to send to your client. |
| **Print** (printer icon) | Opens the system print dialog. |
| **Edit** (pencil icon) | Toggles edit mode (see above). |

### About the PDF

- Always sized as a single A4 page
- Includes a 5 mm safe margin so home and office printers don't clip the design edges
- File size: roughly 10–15 MB (high-resolution image-based PDF for sharp printing)
- For best print quality, choose **"Fit to printable area"** in your printer's dialog

### Scrolling and zooming the poster view

On any platform:
- **Scroll** vertically and horizontally with normal scroll gestures (mouse wheel, touch, trackpad)
- **Pinch to zoom** on mobile and trackpad
- **Ctrl + scroll wheel** to zoom on desktop
- Use the **+ / − / %** buttons in the toolbar to zoom precisely

---

## Where to Get the App

### Web (any device with a browser)

Run the web version locally (see [Running the Web App](#running-the-web-app-dev) below) or host it on Vercel / your own server.

### Android

Build the APK yourself (see [Building the Android APK](#building-the-android-apk)), then install it on your phone. Future versions may publish to the Play Store.

### Windows Desktop

Build the installer (see [Building the Windows Desktop App](#building-the-windows-desktop-app-electron)). The installer creates Start Menu and desktop shortcuts.

> **Note:** None of the builds are currently code-signed, so Windows SmartScreen will warn you on first install. Click **"More info" → "Run anyway"**.

---

## Building From Source (Developers)

### Prerequisites

Install these once on your machine:

| Tool | Version | Download |
|---|---|---|
| **Node.js** | 18 or higher | https://nodejs.org |
| **Git** | Any | https://git-scm.com |
| **Android Studio** | Latest (only if building Android) | https://developer.android.com/studio |
| **Java JDK** | 17 (only if building Android) | Bundled with Android Studio |

> **Glossary:** *Node.js* is the runtime that lets your computer run JavaScript outside a browser. *Git* is the tool that downloads code from GitHub.

### First-Time Setup

```bash
git clone https://github.com/kunacosta/Policy_Snap.git
cd Policy_Snap
npm install
```

The `npm install` step downloads everything PolicySnap needs. It takes a few minutes the first time.

### Running the Web App (Dev)

```bash
npm run dev
```

Open your browser at **http://localhost:3000**. The app reloads automatically whenever you change a file.

### Building the Android APK

#### Step 1 — Build the web bundle and sync to Android

```bash
npm run mobile:sync
```

This builds Next.js as a static site and copies it into the Android project.

#### Step 2 — Open Android Studio

```bash
npm run mobile:open
```

#### Step 3 — Build the APK

1. Wait for Gradle sync to finish (the status bar at the bottom will say *"Sync successful"*)
2. Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. When the build finishes, click **"locate"** in the notification, or find the APK at:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

#### Installing on your phone

Either:
- Connect your phone via USB with USB Debugging enabled, then in Android Studio click **Run → Run 'app'**, **or**
- Transfer `app-debug.apk` to your phone and tap it to install (allow "Install unknown apps" for your file manager first)

> **Enable USB Debugging:** Settings → About Phone → tap *Build Number* seven times → back to Settings → Developer Options → USB Debugging ON

### Building the Windows Desktop App (Electron)

```bash
npm run electron:build
```

This:
1. Builds the Next.js app in standalone mode
2. Packages everything into a Windows installer

The installer (`PolicySnap Setup 1.0.0.exe`) appears in the `dist/` folder. Double-click it to install.

> Must be run on a Windows machine to produce a Windows installer.

To run a packaged copy without making an installer (faster, for testing):

```bash
npm run electron:pack
```

Output goes to `dist/win-unpacked/PolicySnap.exe`.

### Regenerating App Icons

If you update the logo, rebuild all Android icon sizes automatically:

```bash
node scripts/generate-icons.js
```

Then `npm run mobile:sync` again to push the new icons into Android.

### Pushing Updates to GitHub

```bash
git add .
git commit -m "describe what you changed"
git push
```

---

## Project Structure

```
policysnap/
├── src/
│   ├── app/
│   │   ├── page.tsx                    Home (input + prompt copy)
│   │   ├── poster/page.tsx             Single-policy poster (view, edit, export)
│   │   ├── compare/page.tsx            Comparison input page
│   │   └── compare/poster/page.tsx     Comparison poster (view, edit, export)
│   ├── components/
│   │   ├── PolicyDocument.tsx          A4 poster design (inline-styled)
│   │   ├── ComparisonDocument.tsx      Side-by-side comparison layout
│   │   └── ComparisonVerdict.tsx       Verdict summary view
│   ├── lib/
│   │   └── useImageDataUrl.ts          Hook for embedding images as data URLs (needed for html2canvas)
│   └── types/
│       └── policy.ts                   PolicyData and ComparisonData TypeScript types
├── android/                            Capacitor Android project
├── electron/                           Electron desktop app (main.js, preload.js, splash.html)
├── public/                             Logos, icons, banner images
├── scripts/
│   ├── build.js                        Electron build orchestration
│   ├── mobile-build.js                 Android build orchestration
│   └── generate-icons.js               Regenerates Android icon set
├── capacitor.config.ts                 Capacitor/Android config
├── next.config.mjs                     Next.js config (web + Electron)
└── next.config.mobile.mjs              Next.js config for Android (static export mode)
```

### How the three platforms differ

| Platform | Next.js mode | How it runs |
|---|---|---|
| **Web / Dev** | `standalone` | Node.js server on port 3000 |
| **Electron desktop** | `standalone` | Electron spawns the Next.js server as a child process on port 3456 |
| **Android (Capacitor)** | `export` (fully static) | The static HTML/JS files are bundled into the APK and served by the Android WebView |

### How the data flows

```
User enters agent name → stored in localStorage / sessionStorage
                          │
NotebookLM JSON pasted → validated and parsed
                          │
PolicyData object → stored in sessionStorage
                          │
/poster page reads it → renders PolicyDocument
                          │
html2canvas captures the DOM → jsPDF wraps it into an A4 PDF
                          │
Download / Share / Print (platform-specific handlers)
```

---

## Common Issues

**`npm run mobile:sync` fails**
- Make sure `npm install` was run first
- Delete the `out/` folder if it exists and try again

**Android Studio shows Gradle errors**
- Go to **File → Sync Project with Gradle Files**
- Make sure JDK 17 is set under **File → Project Structure → SDK Location**

**APK installs but shows a blank screen**
- Re-run `npm run mobile:sync` to ensure the latest web build is bundled
- In Android Studio: **Build → Clean Project**, then rebuild

**Electron build fails**
- Must be run on Windows
- Make sure `npm install` was done first
- Delete the `dist/` and `.next/` folders and try again

**Windows SmartScreen blocks the installer**
- Click **"More info" → "Run anyway"** — this happens because the installer isn't code-signed yet

**NotebookLM returned JSON but PolicySnap says "invalid"**
- Make sure you copied the entire response, including any opening `{` and closing `}`
- If NotebookLM wrapped it in triple backticks, copy them too — PolicySnap strips them
- Try regenerating with NotebookLM if it cut off mid-response

**Poster looks cramped on a small screen**
- Use the **+** zoom button or pinch to zoom in
- Scroll both horizontally and vertically — the entire A4 page is there

**WhatsApp share doesn't open on web**
- Web falls back to `wa.me` with a text message. For full image sharing, use the Android app.

---

## Contact

**Onyxx Tech**
- Phone: +60 11-3988-4927
- Instagram: @onyxxtech26

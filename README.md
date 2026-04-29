# PolicySnap — by Onyxx Tech

Insurance policy summary poster generator. Paste a NotebookLM JSON response, get a clean A4 poster you can download as PDF, share via WhatsApp, or print.

---

## Prerequisites

Install these once on your machine before anything else.

| Tool | Version | Download |
|---|---|---|
| Node.js | 18 or higher | https://nodejs.org |
| Git | Any | https://git-scm.com |
| Android Studio | Latest | https://developer.android.com/studio |
| Java JDK | 17 | comes with Android Studio |

---

## First-Time Setup

Clone the repo and install dependencies:

```bash
git clone https://github.com/kunacosta/Policy_Snap.git
cd Policy_Snap
npm install
```

---

## Running the Web App (Dev)

```bash
npm run dev
```

Open your browser at **http://localhost:3000**

---

## Building the Android APK

### Step 1 — Build the static export and sync to Android

```bash
npm run mobile:sync
```

This builds Next.js as a static site and syncs it into the Android project automatically.

### Step 2 — Open Android Studio

```bash
npm run mobile:open
```

### Step 3 — Build the APK in Android Studio

1. Wait for Gradle sync to finish (bottom bar will say "Sync successful")
2. Go to **Build → Build Bundle(s) / APK(s) → Build APK(s)**
3. Wait for the build to complete
4. Click **locate** in the notification that appears, or find the APK at:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Installing on your phone

Connect your Android phone via USB with **USB Debugging** enabled, then in Android Studio go to **Run → Run 'app'** to install directly. Or transfer the APK file to your phone and open it to install manually.

> **Enable USB Debugging:** Settings → About Phone → tap Build Number 7 times → Developer Options → USB Debugging ON

---

## Building the Windows Desktop App (Electron)

```bash
npm run electron:build
```

This will:
1. Build the Next.js app
2. Package everything into a Windows installer

The installer (`.exe`) will appear in the `dist/` folder. Double-click it to install PolicySnap as a desktop app.

> This command must be run on a Windows machine.

---

## Regenerating App Icons

If you ever update the logo, run this to rebuild all Android icons automatically:

```bash
node scripts/generate-icons.js
```

Then run `npm run mobile:sync` again to push the new icons into the Android project.

---

## Pushing Updates to GitHub

After making any changes:

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
│   │   ├── page.tsx           ← Home page (input + prompt copy)
│   │   └── poster/page.tsx    ← Poster page (view, edit, export)
│   ├── components/
│   │   └── PolicyDocument.tsx ← The A4 poster design
│   └── types/
│       └── policy.ts          ← PolicyData type definition
├── android/                   ← Capacitor Android project
├── electron/                  ← Electron desktop app
├── public/                    ← Images and icons
├── scripts/
│   ├── build.js               ← Electron build script
│   ├── mobile-build.js        ← Android build script
│   └── generate-icons.js      ← Regenerates all app icons
├── capacitor.config.ts        ← Capacitor/Android config
└── next.config.mobile.mjs    ← Next.js config for Android builds
```

---

## Common Issues

**`npm run mobile:sync` fails**
- Make sure `npm install` was run first
- Delete the `out/` folder if it exists and try again

**Android Studio shows Gradle errors**
- Go to **File → Sync Project with Gradle Files**
- Make sure JDK 17 is set under **File → Project Structure → SDK Location**

**APK installs but shows blank screen**
- Re-run `npm run mobile:sync` to ensure the latest web build is synced
- In Android Studio, **Build → Clean Project**, then rebuild

**Electron build fails**
- Must be run on Windows
- Make sure `npm install` was done first

---

## Contact

**Onyxx Tech**
- 📞 +60 11-3988-4927
- 📸 @onyxtech26

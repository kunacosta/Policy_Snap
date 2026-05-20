# Working on PolicySnap From Two Computers

You have a laptop and a home PC, and you want to work on PolicySnap from either one
without copying files around on a USB stick or through email.

**You already have everything you need: GitHub.**

GitHub is the online home of this project (the *remote*). Think of it as the single
master copy in the cloud. Both your laptop and your PC keep their own local copy and
talk to that one master copy. You **never** transfer files by hand — you "push" your
changes up to GitHub, and "pull" them down on the other machine.

> **Two terms, in plain English:**
> *Git* is the tool that tracks changes to the project's files.
> *GitHub* is the website where the master copy lives (`github.com/kunacosta/Policy_Snap`).

---

## One-Time Setup on Your Home PC

Do this **once** on the PC. After that you just use the daily habit below.

1. **Install the same three tools you have on the laptop:**
   - [Git](https://git-scm.com/download/win)
   - [Node.js](https://nodejs.org) (the "LTS" version)
   - Claude Code

2. **Download the project from GitHub** (this is called *cloning*). Open a terminal
   (PowerShell) in the folder where you keep your projects and run:

   ```bash
   git clone https://github.com/kunacosta/Policy_Snap.git
   ```

   This creates a `Policy_Snap` folder with the whole project inside.

3. **Install the project's building blocks.** Go into the folder and install the
   libraries the app needs:

   ```bash
   cd Policy_Snap
   npm install
   ```

That's it — your PC now has a full working copy.

---

## The Daily Habit (this is the whole trick)

Every time you sit down at **either** machine:

- **Before you start working:** pull the latest from GitHub so you have the newest version.

  ```bash
  git pull
  ```

- **When you finish (or take a break):** save your changes and send them up to GitHub.

  ```bash
  git add -A
  git commit -m "short note about what you changed"
  git push
  ```

Then walk over to the other machine, run `git pull`, and keep going right where you left off.

> ### 🔑 The golden rule
> **Push before you leave a machine. Pull before you start on the other one.**
>
> Follow this and you'll never copy files by hand and never run into conflicts.

---

## Quick Cheat-Sheet

**Start of every session:**
```bash
git pull
npm install      # only needed if package.json changed; safe to run anytime
npm run dev      # start the app at http://localhost:3000
```

**End of every session:**
```bash
git add -A
git commit -m "what you did"
git push
```

---

## Three Things to Know

1. **`node_modules` is not synced — and that's on purpose.**
   That folder holds the downloaded libraries and is huge and machine-specific. Git
   ignores it. That's why you run `npm install` once on each machine. Never try to
   copy `node_modules` between computers.

2. **Claude Code's chat history and memory stay on each machine.**
   Only the *project code* travels through GitHub. Your conversations with Claude on
   the laptop won't appear on the PC, and vice versa. That's normal.

3. **Do NOT keep the project inside OneDrive, Dropbox, or Google Drive.**
   Those services fight with Git and can corrupt the project (especially the hidden
   `.git` folder and `node_modules`). Let Git do the syncing — keep the project in a
   normal folder like `C:\Projects\Policy_Snap`.

---

## Optional: Edit in a Browser With GitHub Codespaces

If you're on a computer where you'd rather not install anything, **GitHub Codespaces**
lets you open and edit the whole project in your web browser. It runs on GitHub's
servers, so there's nothing to set up locally.

1. Go to `github.com/kunacosta/Policy_Snap`.
2. Click the green **Code** button → **Codespaces** tab → **Create codespace on master**.
3. Wait a moment while it sets up. It gives you a full code editor in the browser.
4. In its built-in terminal you can run the same commands:

   ```bash
   npm install
   npm run dev
   ```

Changes you make in a Codespace are committed and pushed to GitHub the same way, so
they sync back to your laptop and PC. (Note: free Codespaces usage has monthly limits,
but they're generous for a project this size.)

---

## Heads-Up: Push Your Current Work First

Before you can pick this project up on the PC with the **latest** changes, make sure
the laptop has pushed everything. As of writing, the latest pushed commit is
`0824cd1` (the home-screen redesign), but there is newer work on the laptop that
hasn't been pushed yet:

- PDF export quality changes (lossless PNG + the 20MB size cap)
- Higher capture resolution (4× on desktop)
- The deductible-badge alignment fixes

Run the **end-of-session** commands above on the laptop to push these, then the PC's
`git pull` will bring everything down.

const { app, BrowserWindow, shell, dialog, Menu, ipcMain } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

const PORT = 3456;
let mainWindow = null;
let serverProcess = null;

// ── SINGLE INSTANCE LOCK ─────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}

// ── Send progress to splash screen ──────────────────────────────
function sendProgress(percent) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('splash-progress', percent);
  }
}

// ── Wait until Next.js server responds ──────────────────────────
function waitForServer(port, maxWaitMs = 60000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + maxWaitMs;

    const attempt = () => {
      const req = http.get(`http://127.0.0.1:${port}`, () => resolve());
      req.on('error', () => {
        if (Date.now() > deadline) {
          reject(new Error(`Server did not respond within ${maxWaitMs / 1000}s`));
        } else {
          setTimeout(attempt, 800);
        }
      });
      req.setTimeout(600, () => req.destroy());
    };

    setTimeout(attempt, 1500);
  });
}

// ── Start the Next.js server ─────────────────────────────────────
function startNextServer() {
  const isProd = app.isPackaged;

  const env = {
    ...process.env,
    PORT: String(PORT),
    HOSTNAME: '127.0.0.1',
    NODE_ENV: isProd ? 'production' : 'development',
  };

  if (isProd) {
    const serverRoot = path.join(process.resourcesPath, 'server');
    const serverJs   = path.join(serverRoot, 'server.js');
    serverProcess = spawn(process.execPath, [serverJs], {
      cwd: serverRoot,
      env: { ...env, ELECTRON_RUN_AS_NODE: '1' },
    });
  } else {
    const devRoot = path.join(__dirname, '..');
    serverProcess = spawn('npm', ['run', 'dev', '--', '--port', String(PORT)], {
      cwd: devRoot,
      shell: true,
      env,
    });
  }

  const stderrLog = [];
  serverProcess.stdout?.on('data', d => process.stdout.write('[next] ' + d));
  serverProcess.stderr?.on('data', d => {
    process.stderr.write('[next] ' + d);
    stderrLog.push(String(d));
  });
  serverProcess.on('error', err => console.error('Server spawn error:', err));
  serverProcess._stderrLog = stderrLog;
}

// ── Gracefully stop the server process ──────────────────────────
function stopServer() {
  if (!serverProcess) return Promise.resolve();
  const proc = serverProcess;
  serverProcess = null;

  return new Promise(resolve => {
    let done = false;
    const finish = () => { if (!done) { done = true; resolve(); } };

    proc.once('exit', finish);
    try { proc.kill('SIGTERM'); } catch {}

    // Force-kill if it hasn't exited within 3 seconds
    setTimeout(() => {
      if (!done) {
        try { proc.kill('SIGKILL'); } catch {}
        finish();
      }
    }, 3000);
  });
}

// ── Create the app window ────────────────────────────────────────
async function createWindow() {
  const publicDir = app.isPackaged
    ? path.join(process.resourcesPath, 'server', 'public')
    : path.join(__dirname, '..', 'public');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 980,
    minHeight: 680,
    title: 'PolicySnap — Onyxx Tech',
    icon: path.join(publicDir, 'icon.ico'),
    backgroundColor: '#1A2E4A',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  Menu.setApplicationMenu(null);

  mainWindow.loadFile(path.join(__dirname, 'splash.html'));
  mainWindow.show();

  // Send realistic progress milestones while the server warms up
  mainWindow.webContents.on('dom-ready', () => {
    const steps = [[600, 15], [2000, 40], [4000, 65], [6500, 85]];
    steps.forEach(([delay, pct]) => {
      setTimeout(() => sendProgress(pct), delay);
    });
  });

  try {
    await waitForServer(PORT);
    sendProgress(100);
    // Brief pause so the user sees 100% before the page loads
    await new Promise(r => setTimeout(r, 300));
    mainWindow.loadURL(`http://127.0.0.1:${PORT}`);
  } catch (err) {
    const log = serverProcess?._stderrLog?.slice(-20).join('') || '';
    dialog.showErrorBox(
      'Failed to Start',
      `PolicySnap could not start the local server.\n\n${err.message}${log ? '\n\nServer log:\n' + log : ''}`
    );
    app.quit();
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F12') {
      mainWindow.webContents.toggleDevTools();
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ── App lifecycle ────────────────────────────────────────────────
app.whenReady().then(() => {
  startNextServer();
  createWindow();
});

app.on('window-all-closed', async () => {
  await stopServer();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', async () => {
  await stopServer();
});

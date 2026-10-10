// Proses utama Electron untuk Solvatra Office (aplikasi desktop).
// Jendela memuat renderer (UI). Akses sistem (dialog berkas, penyimpanan kunci aman,
// buka browser) diberikan ke renderer lewat preload yang terbatas.
const { app, BrowserWindow, ipcMain, dialog, shell, Menu, safeStorage, nativeTheme } = require("electron");
const path = require("node:path");
const fs = require("node:fs");

const SECRETS = () => path.join(app.getPath("userData"), "secrets.json");

// ── penyimpanan kunci: dienkripsi OS (Keychain/DPAPI) bila tersedia ──
function readStore() {
  try { return JSON.parse(fs.readFileSync(SECRETS(), "utf8")); } catch { return {}; }
}
function writeStore(obj) {
  try { fs.mkdirSync(path.dirname(SECRETS()), { recursive: true }); fs.writeFileSync(SECRETS(), JSON.stringify(obj), { mode: 0o600 }); } catch {}
}
function storeGet(key) {
  const raw = readStore()[key];
  if (raw == null) return null;
  if (raw.enc && safeStorage.isEncryptionAvailable()) {
    try { return JSON.parse(safeStorage.decryptString(Buffer.from(raw.enc, "base64"))); } catch { return null; }
  }
  return raw.plain ?? null;
}
function storeSet(key, value) {
  const s = readStore();
  if (safeStorage.isEncryptionAvailable()) s[key] = { enc: safeStorage.encryptString(JSON.stringify(value)).toString("base64") };
  else s[key] = { plain: value };
  writeStore(s);
}
function storeDelete(key) { const s = readStore(); delete s[key]; writeStore(s); }

let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 820, minWidth: 900, minHeight: 600,
    backgroundColor: "#0f1220",
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    icon: path.join(__dirname, "..", "build", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "..", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  win.loadFile(path.join(__dirname, "..", "renderer", "index.html"));
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: "deny" }; });
}

// ── IPC ──
ipcMain.handle("store:get", (_e, key) => storeGet(key));
ipcMain.handle("store:set", (_e, key, value) => { storeSet(key, value); return true; });
ipcMain.handle("store:delete", (_e, key) => { storeDelete(key); return true; });
ipcMain.handle("open-external", (_e, url) => { if (/^https?:\/\//i.test(String(url))) shell.openExternal(url); });
ipcMain.handle("app-info", () => ({ version: app.getVersion(), platform: process.platform, arch: process.arch }));
ipcMain.handle("set-title", (_e, title) => { try { win.setTitle(title || "Solvatra Office"); } catch {} });

ipcMain.handle("save-file", async (_e, { defaultName, base64, text, filters }) => {
  const r = await dialog.showSaveDialog(win, { defaultPath: defaultName, filters });
  if (r.canceled || !r.filePath) return null;
  const buf = base64 != null ? Buffer.from(base64, "base64") : Buffer.from(String(text ?? ""), "utf8");
  fs.writeFileSync(r.filePath, buf);
  return r.filePath;
});

ipcMain.handle("open-file", async (_e, { filters } = {}) => {
  const r = await dialog.showOpenDialog(win, { properties: ["openFile"], filters });
  if (r.canceled || !r.filePaths?.[0]) return null;
  const p = r.filePaths[0];
  const buf = fs.readFileSync(p);
  return { name: path.basename(p), path: p, base64: buf.toString("base64") };
});

ipcMain.handle("theme", (_e, mode) => {
  if (["dark", "light", "system"].includes(mode)) nativeTheme.themeSource = mode;
  return nativeTheme.shouldUseDarkColors ? "dark" : "light";
});

function buildMenu() {
  const isMac = process.platform === "darwin";
  const template = [
    ...(isMac ? [{ role: "appMenu" }] : []),
    {
      label: "Berkas",
      submenu: [
        { label: "Dokumen Markdown baru", accelerator: "CmdOrCtrl+N", click: () => win.webContents.send("menu", "new-markdown") },
        { label: "Presentasi baru", accelerator: "CmdOrCtrl+Shift+N", click: () => win.webContents.send("menu", "new-slides") },
        { type: "separator" },
        { label: "Buka…", accelerator: "CmdOrCtrl+O", click: () => win.webContents.send("menu", "open") },
        { label: "Simpan / Ekspor…", accelerator: "CmdOrCtrl+S", click: () => win.webContents.send("menu", "save") },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    { role: "editMenu" },
    { label: "Tampilan", submenu: [{ role: "reload" }, { role: "toggleDevTools" }, { type: "separator" }, { role: "resetZoom" }, { role: "zoomIn" }, { role: "zoomOut" }, { role: "togglefullscreen" }] },
    { role: "windowMenu" },
    { role: "help", submenu: [{ label: "Solvatra AI", click: () => shell.openExternal("https://solvatra.web.id") }] },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});
app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });

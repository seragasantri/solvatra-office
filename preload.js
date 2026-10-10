// Jembatan aman antara UI (renderer) dan proses utama. Hanya fungsi di bawah yang tersedia
// untuk halaman — tidak ada akses Node mentah.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("solvatra", {
  store: {
    get: (key) => ipcRenderer.invoke("store:get", key),
    set: (key, value) => ipcRenderer.invoke("store:set", key, value),
    delete: (key) => ipcRenderer.invoke("store:delete", key),
  },
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  appInfo: () => ipcRenderer.invoke("app-info"),
  setTitle: (t) => ipcRenderer.invoke("set-title", t),
  saveFile: (opts) => ipcRenderer.invoke("save-file", opts),
  openFile: (opts) => ipcRenderer.invoke("open-file", opts),
  theme: (mode) => ipcRenderer.invoke("theme", mode),
  onMenu: (cb) => ipcRenderer.on("menu", (_e, action) => cb(action)),
});

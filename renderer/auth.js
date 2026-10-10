// Login akun Solvatra (device flow, sama dengan CLI & add-in). Kunci disimpan terenkripsi via main.
export const SERVER = "https://solvatra.web.id";
const UA = "solvatra-office-desktop";

async function api(pathname, { method = "GET", body, key } = {}) {
  const headers = { Accept: "application/json", "User-Agent": UA };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (key) headers.Authorization = `Bearer ${key}`;
  const res = await fetch(SERVER + pathname, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  let json = null; try { json = await res.json(); } catch {}
  return { status: res.status, json };
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function loadAuth() { return window.solvatra.store.get("auth"); }
export async function clearAuth() { await window.solvatra.store.delete("auth"); }

/** -> { ok, user } | { ok:false, reason } */
export async function verify() {
  const a = await loadAuth();
  if (!a) return { ok: false, reason: "none" };
  try {
    const r = await api("/api/cli/me", { key: a.apiKey });
    if (r.status === 200) return { ok: true, user: r.json.data.user, apiKey: a.apiKey };
    if (r.status === 401 || r.status === 403) return { ok: false, reason: "invalid" };
    return { ok: false, reason: "network", message: r.json?.error?.message };
  } catch (e) { return { ok: false, reason: "network", message: e.message }; }
}

/** Login via browser; onCode(code,url). -> auth tersimpan. */
export async function login({ onCode, signal } = {}) {
  const start = await api("/api/cli/device/start", { method: "POST", body: { client_name: "Solvatra Office (desktop)" } });
  if (start.status !== 201) throw new Error(start.json?.error?.message || `Gagal memulai login (HTTP ${start.status})`);
  const d = start.json.data;
  await window.solvatra.openExternal(d.verification_uri_complete);
  onCode?.(d.user_code, d.verification_uri_complete);
  let interval = (d.interval || 5) * 1000;
  const deadline = Date.now() + (d.expires_in || 600) * 1000;
  while (Date.now() < deadline) {
    if (signal?.aborted) throw new Error("Login dibatalkan.");
    await sleep(interval);
    let r; try { r = await api("/api/cli/device/token", { method: "POST", body: { device_code: d.device_code } }); } catch { continue; }
    if (r.status === 429) { interval += 5000; continue; }
    if (r.status !== 200) throw new Error(r.json?.error?.message || `HTTP ${r.status}`);
    const s = r.json.data;
    if (s.status === "pending") continue;
    if (s.status === "slow_down") { interval += 5000; continue; }
    if (s.status === "denied") throw new Error("Login ditolak.");
    if (s.status === "expired") throw new Error("Kode kedaluwarsa. Coba lagi.");
    if (s.status === "approved") { const auth = { apiKey: s.api_key, user: s.user }; await window.solvatra.store.set("auth", auth); return auth; }
  }
  throw new Error("Waktu login habis.");
}

export async function logout() {
  const a = await loadAuth();
  if (a) { try { await api("/api/cli/logout", { method: "POST", body: {}, key: a.apiKey }); } catch {} }
  await clearAuth();
}

export async function listModels(key) {
  try { const r = await api("/api/cli/models", { key }); if (r.status === 200 && Array.isArray(r.json?.data)) return r.json.data; } catch {}
  return [];
}
export const bestModel = (list) => (list.find((m) => m.recommended) || list.find((m) => m.status === "stable") || list.find((m) => m.status === "unknown") || list[0])?.id || null;

// Pengendali UI Solvatra Office: login, tab dokumen, editor per jenis, dan panel AI.
import * as auth from "./auth.js";
import { chat } from "./ai.js";
import * as markdown from "./editors/markdown.js";
import * as slides from "./editors/slides.js";

const EDITORS = { markdown, slides };
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const S = { auth: null, apiKey: null, model: null, models: [], docs: [], activeId: null, running: null, loginAbort: null };

/* ── boot ── */
(async function boot() {
  try { const info = await window.solvatra.appInfo(); S.info = info; } catch {}
  window.solvatra.onMenu(onMenu);
  const v = await auth.verify();
  if (v.ok) { S.auth = { user: v.user }; S.apiKey = v.apiKey; await loadModels(); showApp(); }
  else { if (v.reason === "invalid") await auth.clearAuth(); showLogin(); }
})();

async function loadModels() {
  S.models = await auth.listModels(S.apiKey);
  if (!S.model || !S.models.some((m) => m.id === S.model)) S.model = auth.bestModel(S.models);
}

/* ── login ── */
function showLogin(err) {
  document.body.className = "login";
  $("#root").innerHTML = `
    <div class="login-box">
      <div class="logo">S</div>
      <h1>Solvatra Office</h1>
      <p class="muted">Suite office ber-AI — Markdown, Presentasi, dan lainnya.<br>Masuk dengan akun Solvatra untuk memakai model Anda.</p>
      <button id="btn-login" class="primary">Masuk dengan akun Solvatra</button>
      <div id="login-wait" hidden>
        <p class="muted small">Halaman login terbuka di browser. Masuk, pastikan kodenya sama, lalu <b>Setujui</b>.</p>
        <div id="login-code" class="code"></div>
        <p class="muted small"><span class="dot"></span> Menunggu… <a href="#" id="login-cancel">batal</a></p>
      </div>
      ${err ? `<p class="err">${esc(err)}</p>` : ""}
    </div>`;
  $("#btn-login").onclick = doLogin;
}
async function doLogin() {
  $("#btn-login").disabled = true; $("#login-wait").hidden = false;
  S.loginAbort = new AbortController();
  try {
    S.auth = await auth.login({ signal: S.loginAbort.signal, onCode: (code) => { $("#login-code").textContent = code; } });
    S.apiKey = S.auth.apiKey; await loadModels(); showApp();
  } catch (e) { showLogin(e.message); }
}

/* ── workspace ── */
function showApp() {
  document.body.className = "app";
  $("#root").innerHTML = `
    <header class="topbar">
      <div class="brand"><span class="logo sm">S</span> Solvatra Office</div>
      <div class="tabs" id="tabs"></div>
      <button class="new-btn" id="new-btn" title="Dokumen baru">+ Baru</button>
      <span class="spacer"></span>
      <select id="model" class="model" title="Model AI"></select>
      <button id="account" class="account" title="Akun"></button>
    </header>
    <main class="work">
      <section class="editor-host" id="editor-host"><div class="empty" id="empty"></div></section>
      <aside class="ai" id="ai">
        <div class="ai-head">Asisten AI <button id="ai-collapse" title="Sembunyikan">⟩</button></div>
        <div class="ai-log" id="ai-log"></div>
        <div class="ai-box">
          <textarea id="ai-input" rows="2" placeholder="Minta AI… (mis. buatkan presentasi 8 slide tentang …)"></textarea>
          <button id="ai-send" class="primary" title="Kirim (Enter)">➤</button>
        </div>
      </aside>
    </main>`;
  $("#new-btn").onclick = (e) => newMenu(e);
  $("#account").textContent = S.auth.user?.email || "Akun";
  $("#account").onclick = accountMenu;
  $("#ai-collapse").onclick = () => document.body.classList.toggle("ai-collapsed");
  $("#ai-send").onclick = runAi;
  $("#ai-input").addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); runAi(); } });
  renderModels();
  if (!S.docs.length) openDoc(slides.newDoc()); else renderActive();
  renderTabs();
}

function renderModels() {
  const sel = $("#model"); if (!sel) return;
  const STAT = { stable: "✓", unstable: "⚠", unavailable: "✗", unknown: "•" };
  sel.innerHTML = (S.models.length ? S.models : [{ id: S.model || "-", status: "unknown" }])
    .map((m) => `<option value="${esc(m.id)}" ${m.id === S.model ? "selected" : ""}>${esc(m.id)}${m.recommended ? " ⭐" : ""} ${STAT[m.status] || ""}</option>`).join("");
  sel.onchange = () => { S.model = sel.value; };
}

/* ── tabs & docs ── */
function renderTabs() {
  $("#tabs").innerHTML = S.docs.map((d) =>
    `<div class="tab ${d.id === S.activeId ? "on" : ""}" data-id="${d.id}"><span class="ic">${d.kind === "slides" ? "▭" : "¶"}</span><span class="t">${esc(d.title)}${d.dirty ? " •" : ""}</span><button class="x" data-close="${d.id}">×</button></div>`
  ).join("");
  $("#tabs").querySelectorAll(".tab").forEach((t) => {
    t.onclick = (e) => { if (e.target.dataset.close) return; S.activeId = t.dataset.id; renderActive(); renderTabs(); };
    t.querySelector(".x").onclick = () => closeDoc(t.dataset.close);
  });
}
function openDoc(doc) { S.docs.push(doc); S.activeId = doc.id; renderActive(); renderTabs(); }
function closeDoc(id) {
  const d = S.docs.find((x) => x.id === id);
  if (d?.dirty && !confirm(`Tutup "${d.title}" tanpa menyimpan?`)) return;
  S.docs = S.docs.filter((x) => x.id !== id);
  if (S.activeId === id) S.activeId = S.docs.at(-1)?.id || null;
  if (!S.docs.length) openDoc(markdown.newDoc()); else { renderActive(); renderTabs(); }
}
const activeDoc = () => S.docs.find((d) => d.id === S.activeId);
function renderActive() {
  const d = activeDoc(); const host = $("#editor-host"); if (!host) return;
  host.innerHTML = "";
  if (!d) return;
  const ed = EDITORS[d.kind];
  const el = ed.renderEditor(d, { onChange: () => { renderTabs(); window.solvatra.setTitle(`${d.title} — Solvatra Office`); } });
  d._el = el;
  host.appendChild(el);
  window.solvatra.setTitle(`${d.title} — Solvatra Office`);
}

function newMenu(e) {
  popup(e.currentTarget, [
    ["¶  Dokumen Markdown", () => openDoc(markdown.newDoc())],
    ["▭  Presentasi", () => openDoc(slides.newDoc())],
    ["⤓  Buka berkas…", openFile],
  ]);
}
function accountMenu() {
  popup($("#account"), [
    [`${S.auth.user?.name || ""} ${S.auth.user?.email || ""}`.trim(), null],
    ["Kelola akun & paket ↗", () => window.solvatra.openExternal("https://solvatra.web.id/app/overview")],
    ["Keluar", async () => { await auth.logout(); S.auth = null; S.apiKey = null; S.docs = []; S.activeId = null; showLogin(); }],
  ], true);
}

/* ── open / save ── */
async function openFile() {
  const f = await window.solvatra.openFile({ filters: [{ name: "Markdown/Teks", extensions: ["md", "markdown", "txt"] }] });
  if (!f) return;
  const text = new TextDecoder().decode(Uint8Array.from(atob(f.base64), (c) => c.charCodeAt(0)));
  const doc = markdown.newDoc(); doc.content = text; doc.title = f.name.replace(/\.[^.]+$/, ""); doc.dirty = false;
  openDoc(doc);
}
async function saveActive() {
  const d = activeDoc(); if (!d) return;
  const ed = EDITORS[d.kind];
  const pick = ed.exports_.length === 1 ? ed.exports_[0] : await chooseExport(ed.exports_);
  if (!pick) return;
  try {
    const out = await pick.make(d);
    const name = `${(d.title || "dokumen").replace(/[^\w\s.-]/g, "").trim() || "dokumen"}.${pick.ext}`;
    const path = await window.solvatra.saveFile({ defaultName: name, base64: out.base64, text: out.text, filters: pick.filters });
    if (path) { d.dirty = false; renderTabs(); toast(`Tersimpan: ${path.split("/").pop()}`); }
  } catch (e) { toast(`Gagal menyimpan: ${e.message}`, true); }
}
function chooseExport(list) {
  return new Promise((res) => popup($("#new-btn"), list.map((x) => [x.label, () => res(x)]), false, () => res(null)));
}

/* ── AI ── */
async function runAi() {
  const d = activeDoc(); if (!d || S.running) return;
  const input = $("#ai-input"); const instruction = input.value.trim(); if (!instruction) return;
  if (!S.model) { toast("Belum ada model.", true); return; }
  input.value = "";
  const ed = EDITORS[d.kind];
  const log = $("#ai-log");
  log.insertAdjacentHTML("beforeend", `<div class="msg user">${esc(instruction)}</div>`);
  const bubble = document.createElement("div"); bubble.className = "msg ai working"; bubble.textContent = "Berpikir…";
  log.appendChild(bubble); log.scrollTop = log.scrollHeight;
  $("#ai-send").textContent = "■"; S.running = new AbortController();
  let streamed = "";
  try {
    const { text } = await chat({
      apiKey: S.apiKey, model: S.model, signal: S.running.signal,
      messages: [{ role: "system", content: ed.aiSystem() }, ...ed.aiMessages(d, instruction)],
      onDelta: (dt) => { streamed += dt; bubble.textContent = streamed.slice(0, 4000); log.scrollTop = log.scrollHeight; },
    });
    const note = ed.aiApply(d, text || streamed);
    d._el?._refresh?.();
    renderTabs();
    bubble.className = "msg ai"; bubble.textContent = "✓ " + note;
  } catch (e) {
    bubble.className = "msg ai err"; bubble.textContent = S.running.signal.aborted ? "Dihentikan." : "Gagal: " + e.message;
  } finally { S.running = null; $("#ai-send").textContent = "➤"; log.scrollTop = log.scrollHeight; }
}

/* ── util UI ── */
function onMenu(action) {
  if (action === "new-markdown") openDoc(markdown.newDoc());
  else if (action === "new-slides") openDoc(slides.newDoc());
  else if (action === "open") openFile();
  else if (action === "save") saveActive();
}
function popup(anchor, items, alignRight = false, onClose) {
  document.querySelector(".popup")?.remove();
  const r = anchor.getBoundingClientRect();
  const p = document.createElement("div"); p.className = "popup";
  p.style.top = r.bottom + 4 + "px"; p.style[alignRight ? "right" : "left"] = alignRight ? (innerWidth - r.right) + "px" : r.left + "px";
  p.innerHTML = items.map(([label, fn], i) => `<button data-i="${i}" ${fn ? "" : "disabled"}>${esc(label)}</button>`).join("");
  document.body.appendChild(p);
  const close = () => { p.remove(); document.removeEventListener("mousedown", away); onClose?.(); };
  const away = (e) => { if (!p.contains(e.target) && e.target !== anchor) close(); };
  setTimeout(() => document.addEventListener("mousedown", away), 0);
  p.querySelectorAll("button").forEach((b) => b.onclick = () => { const fn = items[+b.dataset.i][1]; p.remove(); document.removeEventListener("mousedown", away); fn?.(); });
}
function toast(text, bad) {
  const t = document.createElement("div"); t.className = "toast" + (bad ? " bad" : ""); t.textContent = text;
  document.body.appendChild(t); setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 3200);
}

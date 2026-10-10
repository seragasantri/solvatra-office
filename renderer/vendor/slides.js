// Mesin desain slide Solvatra: spesifikasi ISI (jenis slide + teks/angka) → daftar bentuk
// (kotak, lingkaran, garis, teks) dengan tata letak, warna, dan ukuran huruf yang sudah dihitung.
// Model AI apa pun cukup menentukan isi & jenis slide; kualitas visual dijaga di sini, konsisten.
// Tanpa ketergantungan Office: dipakai renderer PowerPoint dan pratinjau SVG (uji/visual QA).

export const W = 960, H = 540, M = 56;

export const THEMES = {
  modern:    { label: "Modern biru-ungu", dark: "#14213D", primary: "#4272F5", secondary: "#A442F5", bg: "#FFFFFF", alt: "#F3F5FB", text: "#1F2937", muted: "#6B7280", light: "#C9D3F0", head: "Century Gothic", body: "Calibri" },
  corporate: { label: "Korporat navy-teal", dark: "#0B2545", primary: "#134074", secondary: "#2A9D8F", bg: "#FFFFFF", alt: "#EEF4F8", text: "#1B263B", muted: "#5C677D", light: "#B9CBDD", head: "Arial", body: "Arial" },
  campus:    { label: "Kampus hijau-emas", dark: "#0B3D2E", primary: "#13795B", secondary: "#C9A227", bg: "#FFFFFF", alt: "#F1F7F3", text: "#1C2B24", muted: "#5E6E66", light: "#BFD9CB", head: "Georgia", body: "Calibri" },
  elegant:   { label: "Elegan hitam-emas", dark: "#111111", primary: "#B8912F", secondary: "#7A6A53", bg: "#FBFAF7", alt: "#F1EDE4", text: "#222222", muted: "#6F6A60", light: "#D9CBA3", head: "Georgia", body: "Calibri" },
  fresh:     { label: "Segar teal-oranye", dark: "#0F3D3E", primary: "#0E9F8E", secondary: "#F97316", bg: "#FFFFFF", alt: "#EEFAF8", text: "#16302F", muted: "#5B7271", light: "#B5E3DC", head: "Trebuchet MS", body: "Calibri" },
  warm:      { label: "Hangat terakota", dark: "#3B1F14", primary: "#D2593A", secondary: "#E9A23B", bg: "#FFFCF7", alt: "#FBEFE3", text: "#3B2A22", muted: "#86705F", light: "#F0C9B5", head: "Georgia", body: "Calibri" },
  nature:    { label: "Alam hijau", dark: "#1B3A2B", primary: "#2D6A4F", secondary: "#74C69D", bg: "#FFFFFF", alt: "#EFF7F2", text: "#1E2D25", muted: "#5F7468", light: "#B7DEC7", head: "Trebuchet MS", body: "Calibri" },
  bold:      { label: "Berani merah-kuning", dark: "#101010", primary: "#E63946", secondary: "#FFB703", bg: "#FFFFFF", alt: "#F5F5F5", text: "#141414", muted: "#666666", light: "#F4B6BB", head: "Arial Black", body: "Arial" },
  minimal:   { label: "Minimal monokrom", dark: "#1A1A1A", primary: "#1A1A1A", secondary: "#8C8C8C", bg: "#FFFFFF", alt: "#F6F6F6", text: "#1A1A1A", muted: "#7A7A7A", light: "#D6D6D6", head: "Arial", body: "Arial" },
};
export const TYPES = ["cover", "section", "agenda", "bullets", "two_column", "stats", "cards", "timeline", "quote", "comparison", "bar_chart", "table", "image_text", "closing"];

// ── ukuran huruf yang muat ──
const CHAR = { head: 0.56, body: 0.5 };
/** Ukuran terbesar (max→min) agar teks muat di kotak w×h. */
export function fit(text, w, h, max, min = 10, kind = "body", lineH = 1.22) {
  const paras = String(text || "").split("\n");
  for (let s = max; s >= min; s--) {
    const perLine = Math.max(1, Math.floor(w / (s * CHAR[kind])));
    const lines = paras.reduce((n, p) => n + Math.max(1, Math.ceil(p.length / perLine)), 0);
    if (lines * s * lineH <= h) return s;
  }
  return min;
}
const clean = (s) => String(s ?? "").replace(/\*\*|__|^#+\s*/g, "").trim();
const arr = (x) => (Array.isArray(x) ? x : x ? [x] : []).map((v) => (typeof v === "string" ? clean(v) : v)).filter((v) => v !== "" && v != null);

// ── pembuat bentuk ──
const rect = (x, y, w, h, fill, extra = {}) => ({ kind: "rect", x, y, w, h, fill, ...extra });
const round = (x, y, w, h, fill, extra = {}) => ({ kind: "round", x, y, w, h, fill, ...extra });
const circle = (x, y, d, fill, extra = {}) => ({ kind: "ellipse", x, y, w: d, h: d, fill, ...extra });
const line = (x, y, w, h, color, weight = 2) => ({ kind: "line", x, y, w, h, line: { color, weight } });
function text(t, x, y, w, h, { size, font, color, bold, italic, align = "left", valign = "top", max, min = 10, kind = "body", lineH } = {}) {
  const s = size || fit(t, w, h, max || 20, min, kind, lineH);
  return { kind: "text", x, y, w, h, text: clean(t), font: { name: font, size: s, color, bold: !!bold, italic: !!italic }, align, valign };
}

function header(spec, T, n, { onDark = false } = {}) {
  const title = clean(spec.title);
  const ops = [];
  ops.push(text(title, M, 34, W - 2 * M, 62, { font: T.head, color: onDark ? "#FFFFFF" : T.dark, bold: true, max: 30, min: 20, kind: "head", valign: "bottom" }));
  ops.push(rect(M, 104, 56, 5, T.secondary));
  if (spec.subtitle) ops.push(text(spec.subtitle, M + 72, 96, W - 2 * M - 72, 22, { font: T.body, color: T.muted, size: 13, valign: "middle" }));
  return ops;
}
function footer(spec, T, n, deck) {
  const ops = [];
  if (deck?.footer) ops.push(text(deck.footer, M, H - 30, 500, 18, { font: T.body, color: T.muted, size: 10, valign: "middle" }));
  if (n) ops.push(text(String(n), W - M - 40, H - 30, 40, 18, { font: T.body, color: T.muted, size: 10, align: "right", valign: "middle" }));
  return ops;
}
const base = (T) => [rect(0, 0, W, H, T.bg), rect(0, 0, 10, H, T.primary)];

/** Satu butir: titik aksen + teks. Mengembalikan ops dan tinggi terpakai. */
function bulletList(items, x, y, w, h, T, { size, gap = 10, color } = {}) {
  const list = arr(items).slice(0, 8);
  if (!list.length) return [];
  const per = (h - gap * (list.length - 1)) / list.length;
  const s = size || Math.min(...list.map((b) => fit(b, w - 26, Math.min(per, 90), 22, 12)));
  const rowH = Math.min(per, Math.max(s * 1.35, ...list.map((b) => Math.ceil(b.length / Math.max(1, Math.floor((w - 26) / (s * 0.5)))) * s * 1.25)) + 2);
  const ops = [];
  let cy = y;
  for (const b of list) {
    ops.push(round(x, cy + s * 0.42, 9, 9, T.primary));
    ops.push(text(b, x + 26, cy, w - 26, rowH, { size: s, font: T.body, color: color || T.text }));
    cy += rowH + gap;
  }
  return ops;
}

// ── jenis slide ──
const LAYOUT = {
  cover(spec, T, n, deck) {
    const ops = [rect(0, 0, W, H, T.dark)];
    ops.push(circle(600, -150, 560, T.primary, { transparency: 0.15 }));
    ops.push(circle(780, 300, 320, T.secondary, { transparency: 0.25 }));
    ops.push(circle(540, 380, 120, T.light, { transparency: 0.7 }));
    ops.push(rect(M, 120, 64, 6, T.secondary));
    ops.push(text(spec.title, M, 140, 560, 170, { font: T.head, color: "#FFFFFF", bold: true, max: 46, min: 28, kind: "head", valign: "top", lineH: 1.12 }));
    if (spec.subtitle) ops.push(text(spec.subtitle, M, 318, 520, 70, { font: T.body, color: "#D7DCEB", max: 20, min: 13 }));
    const meta = [spec.author, spec.date || deck?.date].map(clean).filter(Boolean).join("  ·  ");
    if (meta) ops.push(text(meta, M, H - 70, 520, 24, { font: T.body, color: "#AEB6CC", size: 13, valign: "middle" }));
    return ops;
  },
  section(spec, T, n) {
    const ops = [rect(0, 0, W, H, T.primary), circle(-120, 260, 420, T.dark, { transparency: 0.75 }), rect(W - 180, 0, 180, H, T.dark, { transparency: 0.85 })];
    ops.push(text(clean(spec.number || "").padStart(2, "0") || "—", M, 120, 300, 120, { font: T.head, color: "#FFFFFF", bold: true, size: 96, kind: "head" }));
    ops.push(text(spec.title, M, 250, 640, 110, { font: T.head, color: "#FFFFFF", bold: true, max: 40, min: 24, kind: "head" }));
    if (spec.subtitle) ops.push(text(spec.subtitle, M, 368, 600, 60, { font: T.body, color: "#E6E9F5", max: 18, min: 12 }));
    return ops;
  },
  agenda(spec, T, n, deck) {
    const items = arr(spec.items?.length ? spec.items.map((i) => i.title || i) : spec.bullets).slice(0, 10);
    const ops = [...base(T), ...header(spec, T, n)];
    const cols = items.length > 5 ? 2 : 1, rows = Math.ceil(items.length / cols);
    const avail = H - 140 - 60, colW = (W - 2 * M - (cols - 1) * 40) / cols, rowH = Math.min(80, avail / rows);
    const top = 140 + (avail - rows * rowH) / 2; // blok di tengah ruang yang tersedia
    items.forEach((it, i) => {
      const c = Math.floor(i / rows), r = i % rows, x = M + c * (colW + 40), y = top + r * rowH;
      ops.push(circle(x, y + (rowH - 46) / 2, 46, i % 2 ? T.secondary : T.primary, { text: String(i + 1), font: { name: T.head, size: 18, color: "#FFFFFF", bold: true }, align: "center", valign: "middle" }));
      ops.push(text(it, x + 64, y, colW - 64, rowH, { font: T.body, color: T.text, max: 24, min: 13, valign: "middle" }));
    });
    return [...ops, ...footer(spec, T, n, deck)];
  },
  bullets(spec, T, n, deck) {
    const ops = [...base(T), ...header(spec, T, n)];
    const hasSide = !!spec.highlight;
    const w = hasSide ? 540 : W - 2 * M;
    ops.push(...bulletList(spec.bullets, M, 140, w, H - 140 - 56, T));
    if (hasSide) {
      ops.push(round(M + w + 30, 140, W - M - (M + w + 30), H - 200, T.alt));
      ops.push(rect(M + w + 30, 140, 6, H - 200, T.secondary));
      ops.push(text(spec.highlight_title || "Poin kunci", M + w + 56, 160, W - M - (M + w + 56) - 20, 26, { font: T.head, color: T.primary, bold: true, size: 14, kind: "head" }));
      ops.push(text(spec.highlight, M + w + 56, 194, W - M - (M + w + 56) - 20, H - 280, { font: T.body, color: T.text, max: 22, min: 12 }));
    }
    return [...ops, ...footer(spec, T, n, deck)];
  },
  two_column(spec, T, n, deck) {
    const ops = [...base(T), ...header(spec, T, n)];
    const colW = (W - 2 * M - 30) / 2;
    [spec.left || {}, spec.right || {}].forEach((col, i) => {
      const x = M + i * (colW + 30);
      ops.push(round(x, 140, colW, H - 196, i ? T.alt : T.bg, { line: i ? null : { color: T.light, weight: 1 } }));
      ops.push(rect(x, 140, colW, 6, i ? T.secondary : T.primary));
      ops.push(text(col.heading || col.title || "", x + 22, 160, colW - 44, 34, { font: T.head, color: i ? T.secondary : T.primary, bold: true, max: 20, min: 14, kind: "head" }));
      ops.push(...bulletList(col.bullets || col.items, x + 22, 204, colW - 44, H - 290, T));
    });
    return [...ops, ...footer(spec, T, n, deck)];
  },
  stats(spec, T, n, deck) {
    const items = arr(spec.items).slice(0, 4);
    const ops = [...base(T), ...header(spec, T, n)];
    const k = Math.max(1, items.length), gap = 24, cw = (W - 2 * M - gap * (k - 1)) / k, ch = spec.caption ? 230 : 280;
    items.forEach((it, i) => {
      const x = M + i * (cw + gap), y = 150;
      ops.push(round(x, y, cw, ch, T.alt));
      ops.push(rect(x, y, cw, 6, i % 2 ? T.secondary : T.primary));
      ops.push(text(it.value ?? "", x + 18, y + 34, cw - 36, 90, { font: T.head, color: i % 2 ? T.secondary : T.primary, bold: true, max: 54, min: 24, kind: "head", align: "center", valign: "middle" }));
      ops.push(text(it.label || it.title || "", x + 18, y + 130, cw - 36, 40, { font: T.head, color: T.dark, bold: true, max: 17, min: 12, align: "center" }));
      if (it.text) ops.push(text(it.text, x + 18, y + 172, cw - 36, ch - 186, { font: T.body, color: T.muted, max: 14, min: 10, align: "center" }));
    });
    if (spec.caption) ops.push(text(spec.caption, M, 400, W - 2 * M, 60, { font: T.body, color: T.text, max: 18, min: 12, align: "center", valign: "middle" }));
    return [...ops, ...footer(spec, T, n, deck)];
  },
  cards(spec, T, n, deck) {
    const items = arr(spec.items).slice(0, 4);
    const ops = [...base(T), ...header(spec, T, n)];
    const k = Math.max(1, items.length), gap = 22, cw = (W - 2 * M - gap * (k - 1)) / k, ch = H - 150 - 60;
    items.forEach((it, i) => {
      const x = M + i * (cw + gap), y = 146, c = i % 2 ? T.secondary : T.primary;
      ops.push(round(x, y, cw, ch, T.bg, { line: { color: T.light, weight: 1 } }));
      ops.push(circle(x + 22, y + 24, 48, c, { text: clean(it.icon) || String(i + 1), font: { name: T.head, size: it.icon ? 20 : 18, color: "#FFFFFF", bold: true }, align: "center", valign: "middle" }));
      ops.push(text(it.title || "", x + 22, y + 88, cw - 44, 52, { font: T.head, color: T.dark, bold: true, max: 18, min: 12, kind: "head" }));
      ops.push(text(it.text || "", x + 22, y + 144, cw - 44, ch - 160, { font: T.body, color: T.muted, max: 17, min: 10 }));
    });
    return [...ops, ...footer(spec, T, n, deck)];
  },
  timeline(spec, T, n, deck) {
    const items = arr(spec.items).slice(0, 6);
    const ops = [...base(T), ...header(spec, T, n)];
    const k = Math.max(1, items.length), step = (W - 2 * M) / k, ly = 250;
    ops.push(rect(M + step / 2, ly - 2, step * (k - 1) || 1, 4, T.light));
    items.forEach((it, i) => {
      const cx = M + step * i + step / 2, c = i % 2 ? T.secondary : T.primary;
      ops.push(circle(cx - 32, ly - 32, 64, c, { text: clean(it.label || it.date || String(i + 1)).slice(0, 6), font: { name: T.head, size: 15, color: "#FFFFFF", bold: true }, align: "center", valign: "middle" }));
      ops.push(text(it.title || "", cx - step / 2 + 8, ly + 50, step - 16, 52, { font: T.head, color: T.dark, bold: true, max: 19, min: 12, align: "center", kind: "head" }));
      if (it.text) ops.push(text(it.text, cx - step / 2 + 8, ly + 106, step - 16, H - ly - 160, { font: T.body, color: T.muted, max: 15, min: 10, align: "center" }));
    });
    return [...ops, ...footer(spec, T, n, deck)];
  },
  quote(spec, T, n, deck) {
    const ops = [rect(0, 0, W, H, T.alt), rect(0, 0, 10, H, T.primary)];
    ops.push(text("“", M + 10, 30, 160, 170, { font: "Georgia", color: T.primary, size: 160, bold: true }));
    ops.push(text(spec.quote || spec.title || "", M + 60, 150, W - 2 * M - 120, 230, { font: T.head, color: T.dark, italic: true, max: 34, min: 18, kind: "head", valign: "middle", lineH: 1.25 }));
    if (spec.author) {
      ops.push(rect(M + 60, 404, 40, 3, T.secondary));
      ops.push(text(spec.author, M + 112, 392, 600, 28, { font: T.body, color: T.muted, size: 15, valign: "middle" }));
    }
    return [...ops, ...footer(spec, T, n, deck)];
  },
  comparison(spec, T, n, deck) {
    const ops = [...base(T), ...header(spec, T, n)];
    const colW = (W - 2 * M - 30) / 2;
    [spec.left || {}, spec.right || {}].forEach((col, i) => {
      const x = M + i * (colW + 30), c = i ? T.secondary : T.primary;
      ops.push(round(x, 140, colW, 52, c, { text: clean(col.heading || col.title || (i ? "B" : "A")), font: { name: T.head, size: 18, color: "#FFFFFF", bold: true }, align: "center", valign: "middle" }));
      ops.push(round(x, 200, colW, H - 290, T.alt));
      ops.push(...bulletList(col.bullets || col.items, x + 20, 218, colW - 40, H - 330, T));
    });
    if (spec.verdict) ops.push(text(spec.verdict, M, H - 82, W - 2 * M, 30, { font: T.body, color: T.dark, bold: true, max: 15, min: 11, align: "center", valign: "middle" }));
    return [...ops, ...footer(spec, T, n, deck)];
  },
  bar_chart(spec, T, n, deck) {
    const data = arr(spec.data).slice(0, 8).map((d) => ({ label: clean(d.label), value: Number(d.value) || 0, display: d.display }));
    const ops = [...base(T), ...header(spec, T, n)];
    const hasNote = !!spec.caption;
    const cx = M, cw = hasNote ? 600 : W - 2 * M, top = 150, bottom = H - 96, chH = bottom - top;
    const max = Math.max(1, ...data.map((d) => d.value));
    const k = Math.max(1, data.length), slot = cw / k, bw = Math.min(70, slot * 0.6);
    ops.push(line(cx, bottom, cw, 0, T.light, 1.5));
    data.forEach((d, i) => {
      const h = Math.max(4, (d.value / max) * (chH - 40)), x = cx + slot * i + (slot - bw) / 2;
      const top3 = d.value === max;
      ops.push(rect(x, bottom - h, bw, h, top3 ? T.secondary : T.primary));
      ops.push(text(d.display || d.value.toLocaleString("id-ID"), x - 20, bottom - h - 26, bw + 40, 22, { font: T.head, color: T.dark, bold: true, size: 13, align: "center", valign: "bottom" }));
      ops.push(text(d.label, cx + slot * i + 4, bottom + 8, slot - 8, 34, { font: T.body, color: T.muted, max: 12, min: 9, align: "center" }));
    });
    if (hasNote) {
      ops.push(round(cx + cw + 30, top, W - M - (cx + cw + 30), bottom - top, T.alt));
      ops.push(text("Insight", cx + cw + 50, top + 20, W - M - (cx + cw + 50) - 20, 24, { font: T.head, color: T.primary, bold: true, size: 14 }));
      ops.push(text(spec.caption, cx + cw + 50, top + 52, W - M - (cx + cw + 50) - 20, bottom - top - 70, { font: T.body, color: T.text, max: 18, min: 11 }));
    }
    return [...ops, ...footer(spec, T, n, deck)];
  },
  table(spec, T, n, deck) {
    const rows = (Array.isArray(spec.rows) ? spec.rows : []).slice(0, 9).map((r) => (Array.isArray(r) ? r : [r]).slice(0, 6).map(clean));
    const ops = [...base(T), ...header(spec, T, n)];
    if (!rows.length) return ops;
    const cols = Math.max(...rows.map((r) => r.length)), tw = W - 2 * M, cw = tw / cols, top = 140;
    const rh = Math.min(52, (H - top - 60) / rows.length);
    const size = Math.min(17, ...rows.flat().map((c) => fit(c, cw - 20, rh - 6, 17, 9)));
    rows.forEach((r, i) => {
      const y = top + i * rh, headRow = i === 0;
      ops.push(rect(M, y, tw, rh, headRow ? T.primary : i % 2 ? T.bg : T.alt));
      for (let j = 0; j < cols; j++) {
        ops.push(text(r[j] ?? "", M + j * cw + 10, y, cw - 20, rh, { font: headRow ? T.head : T.body, color: headRow ? "#FFFFFF" : T.text, bold: headRow, size, valign: "middle", align: j === 0 ? "left" : "center" }));
      }
    });
    ops.push(line(M, top + rows.length * rh, tw, 0, T.light, 1));
    return [...ops, ...footer(spec, T, n, deck)];
  },
  image_text(spec, T, n, deck) {
    const ops = [...base(T)];
    ops.push(round(M, 56, 400, H - 112, T.alt, { image: spec.image || null, text: spec.image ? "" : "Gambar", font: { name: T.body, size: 14, color: T.muted }, align: "center", valign: "middle" }));
    ops.push(text(spec.title || "", M + 430, 70, W - M - (M + 430), 90, { font: T.head, color: T.dark, bold: true, max: 30, min: 18, kind: "head", valign: "bottom" }));
    ops.push(rect(M + 430, 168, 56, 5, T.secondary));
    ops.push(...bulletList(spec.bullets, M + 430, 192, W - M - (M + 430), H - 250, T));
    return [...ops, ...footer(spec, T, n, deck)];
  },
  closing(spec, T, n) {
    const ops = [rect(0, 0, W, H, T.dark), circle(-160, -160, 460, T.primary, { transparency: 0.2 }), circle(W - 260, H - 220, 380, T.secondary, { transparency: 0.3 })];
    ops.push(text(spec.title || "Terima kasih", M, 170, W - 2 * M, 110, { font: T.head, color: "#FFFFFF", bold: true, max: 54, min: 30, kind: "head", align: "center", valign: "middle" }));
    if (spec.subtitle) ops.push(text(spec.subtitle, M + 80, 290, W - 2 * M - 160, 60, { font: T.body, color: "#D7DCEB", max: 20, min: 12, align: "center" }));
    const contact = arr(spec.bullets || spec.contact).join("   ·   ");
    if (contact) ops.push(text(contact, M, 380, W - 2 * M, 40, { font: T.body, color: "#AEB6CC", max: 15, min: 10, align: "center", valign: "middle" }));
    return ops;
  },
};

/** Spesifikasi satu slide → daftar bentuk. */
export function layoutSlide(spec, theme = "modern", n = 0, deck = {}) {
  const T = THEMES[theme] || THEMES.modern;
  const type = LAYOUT[spec?.type] ? spec.type : spec?.bullets?.length ? "bullets" : "cover";
  return LAYOUT[type](spec || {}, T, n, deck);
}

/** Pratinjau SVG (uji & pemeriksaan visual) — bentuk yang sama persis dengan yang digambar di PowerPoint. */
export function toSvg(ops, scale = 1) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const out = [`<svg xmlns="http://www.w3.org/2000/svg" width="${W * scale}" height="${H * scale}" viewBox="0 0 ${W} ${H}">`];
  for (const o of ops) {
    const op = o.transparency ? ` fill-opacity="${1 - o.transparency}"` : "";
    const st = o.line ? ` stroke="${o.line.color}" stroke-width="${o.line.weight}"` : "";
    if (o.kind === "rect") out.push(`<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" fill="${o.fill || "none"}"${op}${st}/>`);
    if (o.kind === "round") out.push(`<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" rx="${Math.min(14, o.h / 4)}" fill="${o.fill || "none"}"${op}${st}/>`);
    if (o.kind === "ellipse") out.push(`<ellipse cx="${o.x + o.w / 2}" cy="${o.y + o.h / 2}" rx="${o.w / 2}" ry="${o.h / 2}" fill="${o.fill}"${op}/>`);
    if (o.kind === "line") out.push(`<line x1="${o.x}" y1="${o.y}" x2="${o.x + o.w}" y2="${o.y + o.h}" stroke="${o.line.color}" stroke-width="${o.line.weight}"/>`);
    if (o.text && o.font) {
      const f = o.font, size = f.size, lineH = size * 1.22;
      const perLine = Math.max(1, Math.floor(o.w / (size * (f.bold ? 0.56 : 0.5))));
      const lines = [];
      for (const p of String(o.text).split("\n")) {
        let cur = "";
        for (const word of p.split(" ")) { if ((cur + " " + word).trim().length > perLine && cur) { lines.push(cur); cur = word; } else cur = (cur + " " + word).trim(); }
        lines.push(cur);
      }
      const total = lines.length * lineH;
      let y0 = o.valign === "middle" ? o.y + (o.h - total) / 2 : o.valign === "bottom" ? o.y + o.h - total : o.y;
      const anchor = o.align === "center" ? "middle" : o.align === "right" ? "end" : "start";
      const x = o.align === "center" ? o.x + o.w / 2 : o.align === "right" ? o.x + o.w : o.x;
      lines.forEach((l, i) => out.push(`<text x="${x}" y="${y0 + (i + 0.82) * lineH}" font-family="${f.name}" font-size="${size}" fill="${f.color}" text-anchor="${anchor}"${f.bold ? ' font-weight="bold"' : ""}${f.italic ? ' font-style="italic"' : ""}>${esc(l)}</text>`));
    }
  }
  out.push("</svg>");
  return out.join("");
}

// Editor Markdown: tulis di kiri, pratinjau langsung di kanan. Ekspor .md / .docx.
import { md } from "../vendor/markdown.js";

export const kind = "markdown";
export const ext = "md";
export const newDoc = () => ({ id: crypto.randomUUID(), kind, title: "Dokumen", content: "# Judul\n\nMulai menulis…", dirty: false });

export function renderEditor(doc, { onChange } = {}) {
  const el = document.createElement("div");
  el.className = "md-editor";
  el.innerHTML = `<textarea class="md-input" spellcheck="false"></textarea><div class="md-preview md-body"></div>`;
  const ta = el.querySelector(".md-input"), pv = el.querySelector(".md-preview");
  ta.value = doc.content;
  const paint = () => { pv.innerHTML = md(doc.content); };
  ta.addEventListener("input", () => { doc.content = ta.value; doc.dirty = true; paint(); onChange?.(); });
  // sinkron scroll kasar
  ta.addEventListener("scroll", () => { pv.scrollTop = ta.scrollTop * (pv.scrollHeight - pv.clientHeight) / Math.max(1, ta.scrollHeight - ta.clientHeight); });
  paint();
  el._refresh = () => { ta.value = doc.content; paint(); };
  return el;
}

export const aiSystem = () =>
  "Anda adalah editor dokumen Markdown di aplikasi office. Pengguna memberi dokumen saat ini dan satu instruksi. " +
  "Kerjakan instruksi itu lalu kembalikan HANYA dokumen Markdown versi baru yang LENGKAP (seluruh dokumen, bukan potongan), " +
  "tanpa penjelasan dan tanpa pagar kode ```. Jaga bagian yang tidak diminta diubah. Rapi, gunakan heading/daftar/tabel Markdown bila sesuai. " +
  "Jawab dalam bahasa dokumen/instruksi (bawaan Bahasa Indonesia).";

export const aiMessages = (doc, instruction) => ([
  { role: "user", content: `Dokumen Markdown saat ini:\n<<<\n${doc.content}\n>>>\n\nInstruksi: ${instruction}` },
]);

export function aiApply(doc, text) {
  let out = String(text).trim();
  const fence = out.match(/^```(?:markdown|md)?\s*\n([\s\S]*?)```$/i);
  if (fence) out = fence[1].trim();
  doc.content = out; doc.dirty = true;
  return "Dokumen diperbarui.";
}

export const exports_ = [
  { label: "Markdown (.md)", ext: "md", filters: [{ name: "Markdown", extensions: ["md"] }], make: async (doc) => ({ text: doc.content }) },
  { label: "Word (.docx)", ext: "docx", filters: [{ name: "Word", extensions: ["docx"] }], make: async (doc) => ({ base64: await (await import("../export-docx.js")).buildDocx(doc.content) }) },
];

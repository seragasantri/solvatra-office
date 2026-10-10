// Editor Presentasi: AI menyusun dek (judul + isi per slide); desain & tata letak dari mesin
// slides.js (konsisten, cantik, model apa pun). Pratinjau SVG; ekspor .pptx asli.
import { layoutSlide, toSvg, THEMES, TYPES } from "../vendor/slides.js";

export const kind = "slides";
export const ext = "pptx";
export const newDoc = () => ({
  id: crypto.randomUUID(), kind, title: "Presentasi", dirty: false,
  deck: { theme: "modern", footer: "", slides: [
    { type: "cover", title: "Judul Presentasi", subtitle: "Subjudul singkat", author: "" },
  ] },
});

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;");

export function renderEditor(doc, { onChange } = {}) {
  const el = document.createElement("div");
  el.className = "sl-editor";
  el.innerHTML = `
    <div class="sl-main">
      <div class="sl-bar">
        <label>Tema
          <select class="sl-theme">${Object.entries(THEMES).map(([k, t]) => `<option value="${k}">${esc(t.label)}</option>`).join("")}</select>
        </label>
        <span class="sl-count"></span>
        <button class="sl-json-toggle" type="button">Edit rincian (JSON)</button>
      </div>
      <div class="sl-grid"></div>
      <textarea class="sl-json" spellcheck="false" hidden></textarea>
    </div>`;
  const grid = el.querySelector(".sl-grid"), themeSel = el.querySelector(".sl-theme"), count = el.querySelector(".sl-count");
  const json = el.querySelector(".sl-json"), toggle = el.querySelector(".sl-json-toggle");
  themeSel.value = doc.deck.theme || "modern";

  const paint = () => {
    const d = doc.deck;
    count.textContent = `${d.slides.length} slide`;
    grid.innerHTML = d.slides.map((s, i) => {
      let svg = ""; try { svg = toSvg(layoutSlide(s, d.theme, i + 1, d), 0.42); } catch (e) { svg = `<div class="sl-err">slide ${i + 1}: ${esc(e.message)}</div>`; }
      return `<figure class="sl-thumb"><div class="sl-frame">${svg}</div><figcaption>${i + 1}. ${esc(s.type || "?")}${s.title ? " · " + esc(String(s.title).slice(0, 40)) : ""}</figcaption></figure>`;
    }).join("");
  };
  themeSel.addEventListener("change", () => { doc.deck.theme = themeSel.value; doc.dirty = true; paint(); onChange?.(); });
  toggle.addEventListener("click", () => {
    const show = json.hidden;
    if (show) { json.value = JSON.stringify(doc.deck, null, 2); json.hidden = false; grid.hidden = true; toggle.textContent = "Lihat pratinjau"; }
    else { json.hidden = true; grid.hidden = false; toggle.textContent = "Edit rincian (JSON)"; }
  });
  json.addEventListener("input", () => {
    try { const d = JSON.parse(json.value); if (d && Array.isArray(d.slides)) { doc.deck = d; doc.dirty = true; themeSel.value = d.theme || "modern"; onChange?.(); json.classList.remove("bad"); } }
    catch { json.classList.add("bad"); }
  });
  paint();
  el._refresh = () => { themeSel.value = doc.deck.theme || "modern"; if (!json.hidden) json.value = JSON.stringify(doc.deck, null, 2); paint(); };
  return el;
}

const TYPE_HELP = `Jenis slide (field):
- cover {title, subtitle?, author?, date?}
- section {number?, title, subtitle?}
- agenda {title, items:[string]}  (atau bullets:[string])
- bullets {title, subtitle?, bullets:[string], highlight?, highlight_title?}
- two_column {title, left:{heading,bullets:[]}, right:{heading,bullets:[]}}
- comparison {title, left:{heading,bullets:[]}, right:{heading,bullets:[]}, verdict?}
- stats {title, items:[{value, label, text?}]}  (maks 4)
- cards {title, items:[{title, text, icon?}]}  (maks 4)
- timeline {title, items:[{label, title, text?}]}  (maks 6)
- bar_chart {title, data:[{label, value}], caption?}  (maks 8)
- table {title, rows:[[sel,...]]}  (baris pertama = header)
- quote {quote, author?}
- image_text {title, bullets:[string]}
- closing {title, subtitle?, bullets:[string]}`;

export const aiSystem = () =>
  "Anda perancang presentasi. Dari permintaan pengguna, susun sebuah DEK dan kembalikan HANYA JSON valid " +
  "(tanpa penjelasan, tanpa pagar kode) berbentuk: {\"theme\": <nama tema>, \"footer\": <teks opsional>, \"slides\": [ <slide>, ... ]}.\n" +
  `Tema tersedia: ${Object.keys(THEMES).join(", ")}.\n` +
  `${TYPE_HELP}\n` +
  "Pedoman: mulai dengan slide cover, biasanya tambah agenda, lalu isi (bullets/stats/cards/timeline/two_column/bar_chart/table/quote), tutup dengan closing. " +
  "Teks ringkas (judul < 8 kata; butir < 14 kata; maks 6 butir/slide). Isi dengan konten nyata & relevan sesuai permintaan, bukan placeholder. " +
  "Pilih tema yang cocok dengan topik. Bahasa mengikuti permintaan (bawaan Bahasa Indonesia).";

export const aiMessages = (doc, instruction) => {
  const hasDeck = doc.deck?.slides?.length > 1 || (doc.deck?.slides?.[0] && doc.deck.slides[0].title !== "Judul Presentasi");
  const ctx = hasDeck ? `Dek saat ini (JSON):\n${JSON.stringify(doc.deck)}\n\n` : "";
  return [{ role: "user", content: `${ctx}Permintaan: ${instruction}` }];
};

export function aiApply(doc, text) {
  let body = String(text).trim();
  const fence = body.match(/```(?:json)?\s*\n([\s\S]*?)```/i); if (fence) body = fence[1].trim();
  let deck; try { deck = JSON.parse(body); } catch {
    const a = body.indexOf("{"), b = body.lastIndexOf("}"); if (a >= 0 && b > a) deck = JSON.parse(body.slice(a, b + 1));
  }
  if (!deck || !Array.isArray(deck.slides)) throw new Error("AI tidak mengembalikan dek yang valid.");
  if (!THEMES[deck.theme]) deck.theme = doc.deck?.theme || "modern";
  deck.slides = deck.slides.filter((s) => s && (TYPES.includes(s.type) || s.title || s.bullets));
  if (!deck.slides.length) throw new Error("Dek kosong.");
  doc.deck = deck; doc.dirty = true;
  return `Presentasi ${deck.slides.length} slide dibuat (tema ${THEMES[deck.theme].label}).`;
}

export const exports_ = [
  { label: "PowerPoint (.pptx)", ext: "pptx", filters: [{ name: "PowerPoint", extensions: ["pptx"] }], make: async (doc) => ({ base64: await (await import("../export-pptx.js")).buildPptx(doc.deck) }) },
];

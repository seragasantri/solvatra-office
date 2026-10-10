// Ekspor dek (spesifikasi slide) → berkas .pptx asli, dengan memetakan bentuk dari mesin desain
// (slides.js, ruang 960×540 px @96dpi) ke pptxgenjs (satuan inci / poin).
import pptxgen from "pptxgenjs";
import { layoutSlide, W, H } from "./vendor/slides.js";

const IN = (px) => px / 96;             // px → inci
const PT = (px) => +(px * 0.75).toFixed(1); // px → poin (960px=10in=720pt)
const hex = (c) => String(c || "").replace("#", "").toUpperCase() || "000000";
const VAL = { top: "top", middle: "middle", bottom: "bottom" };

export async function buildPptx(deck) {
  const pptx = new pptxgen();
  pptx.defineLayout({ name: "SOLV", width: IN(W), height: IN(H) });
  pptx.layout = "SOLV";
  pptx.author = "Solvatra Office";
  const slides = Array.isArray(deck?.slides) ? deck.slides : [];
  slides.forEach((spec, i) => {
    const ops = layoutSlide(spec, deck.theme || "modern", i + 1, deck);
    const slide = pptx.addSlide();
    for (const o of ops) {
      const box = { x: IN(o.x), y: IN(o.y), w: IN(o.w), h: IN(o.h) };
      const fill = o.fill ? { color: hex(o.fill), ...(o.transparency ? { transparency: Math.round(o.transparency * 100) } : {}) } : undefined;
      const line = o.line ? { color: hex(o.line.color), width: o.line.weight || 1 } : undefined;
      if (o.kind === "rect" || o.kind === "round" || o.kind === "ellipse") {
        const type = o.kind === "ellipse" ? pptx.ShapeType.ellipse : pptx.ShapeType.rect;
        const opt = { ...box, ...(fill ? { fill } : { fill: { type: "none" } }), ...(line ? { line } : {}) };
        if (o.kind === "round") opt.rectRadius = Math.min(0.14, IN(o.h) / 4);
        slide.addShape(type, opt);
        if (o.text && o.font) slide.addText(String(o.text), { ...box, fontFace: o.font.name, fontSize: PT(o.font.size), color: hex(o.font.color), bold: !!o.font.bold, italic: !!o.font.italic, align: o.align || "center", valign: VAL[o.valign] || "middle", margin: 0 });
      } else if (o.kind === "line") {
        slide.addShape(pptx.ShapeType.line, { ...box, line: { color: hex(o.line.color), width: o.line.weight || 1 } });
      } else if (o.kind === "text" && o.font) {
        slide.addText(String(o.text || ""), { ...box, fontFace: o.font.name, fontSize: PT(o.font.size), color: hex(o.font.color), bold: !!o.font.bold, italic: !!o.font.italic, align: o.align || "left", valign: VAL[o.valign] || "top", margin: 0, wrap: true });
      }
    }
  });
  return pptx.write({ outputType: "base64" }); // -> string base64
}

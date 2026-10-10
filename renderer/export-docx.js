// Ekspor Markdown → berkas .docx asli (library "docx"). Judul, paragraf, daftar, kutipan, kode,
// dan gaya inline tebal/miring/`kode`. Rapi & bisa dibuka di Microsoft Word.
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";

function inline(text) {
  const runs = []; let i = 0;
  const re = /(\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*|_([^_]+)_|`([^`]+)`)/g;
  let m;
  while ((m = re.exec(text))) {
    if (m.index > i) runs.push(new TextRun(text.slice(i, m.index)));
    if (m[2] || m[3]) runs.push(new TextRun({ text: m[2] || m[3], bold: true }));
    else if (m[4] || m[5]) runs.push(new TextRun({ text: m[4] || m[5], italics: true }));
    else if (m[6]) runs.push(new TextRun({ text: m[6], font: "Consolas" }));
    i = m.index + m[0].length;
  }
  if (i < text.length) runs.push(new TextRun(text.slice(i)));
  return runs.length ? runs : [new TextRun(text)];
}

export async function buildDocx(markdown) {
  const lines = String(markdown || "").replace(/\r\n?/g, "\n").split("\n");
  const kids = []; let inCode = false;
  const HEAD = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4, HeadingLevel.HEADING_5, HeadingLevel.HEADING_6];
  for (const raw of lines) {
    if (/^```/.test(raw)) { inCode = !inCode; continue; }
    if (inCode) { kids.push(new Paragraph({ children: [new TextRun({ text: raw, font: "Consolas", size: 20 })], shading: { fill: "F2F2F2" } })); continue; }
    const h = raw.match(/^(#{1,6})\s+(.*)/);
    if (h) { kids.push(new Paragraph({ heading: HEAD[h[1].length - 1], children: inline(h[2]) })); continue; }
    if (/^>\s?/.test(raw)) { kids.push(new Paragraph({ children: inline(raw.replace(/^>\s?/, "")), style: "IntenseQuote", indent: { left: 360 } })); continue; }
    const ul = raw.match(/^\s*[-*+]\s+(.*)/);
    if (ul) { kids.push(new Paragraph({ children: inline(ul[1]), bullet: { level: 0 } })); continue; }
    const ol = raw.match(/^\s*\d+[.)]\s+(.*)/);
    if (ol) { kids.push(new Paragraph({ children: inline(ol[1]), numbering: { reference: "num", level: 0 } })); continue; }
    if (raw.trim() === "") { kids.push(new Paragraph("")); continue; }
    kids.push(new Paragraph({ children: inline(raw) }));
  }
  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 22 } } } },
    numbering: { config: [{ reference: "num", levels: [{ level: 0, format: "decimal", text: "%1.", alignment: "start" }] }] },
    sections: [{ children: kids.length ? kids : [new Paragraph("")] }],
  });
  const blob = await Packer.toBlob(doc);
  const buf = await blob.arrayBuffer();
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

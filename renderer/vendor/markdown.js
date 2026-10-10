// Markdown kecil untuk bubble chat — escape HTML dulu, baru format (aman dari XSS).
export const esc = (t) => String(t ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function md(src) {
  // blok kode diangkat dulu agar tak pernah diformat inline maupun dibungkus <p>
  const blocks = [];
  let s = esc(src).replace(/```(\w*)\n?([\s\S]*?)```/g, (_, _lang, code) =>
    `\n\x00${blocks.push(`<pre><code>${code.replace(/\n$/, "")}</code></pre>`) - 1}\x00\n`);

  s = s.replace(/`([^`\n]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");

  const out = [];
  let list = null;
  const close = () => { if (list) { out.push(`</${list}>`); list = null; } };

  for (const raw of s.split("\n")) {
    const line = raw.trimEnd();
    const code = line.match(/^\x00(\d+)\x00$/);
    const h = line.match(/^(#{1,3})\s+(.*)$/);
    const ul = line.match(/^[-*]\s+(.*)$/);
    const ol = line.match(/^(\d+)\.\s+(.*)$/);
    const bq = line.match(/^&gt;\s?(.*)$/);

    if (code) { close(); out.push(blocks[+code[1]]); }
    else if (ul || ol) {
      const tag = ul ? "ul" : "ol";
      if (list !== tag) { close(); out.push(`<${tag}>`); list = tag; }
      out.push(`<li>${ul ? ul[1] : ol[2]}</li>`);
    }
    else if (h) { close(); out.push(`<h3>${h[2]}</h3>`); }
    else if (bq) { close(); out.push(`<blockquote>${bq[1]}</blockquote>`); }
    else if (!line.trim()) close();
    else { close(); out.push(`<p>${line}</p>`); }
  }
  close();
  return out.join("");
}


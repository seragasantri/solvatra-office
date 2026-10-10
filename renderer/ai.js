// Panggilan AI ke gateway Solvatra (/v1). Mode satu-tembak streaming (untuk editor: transform
// dokumen / hasilkan slide). reasoning_effort rendah = cepat.
import { SERVER } from "./auth.js";

/** Streaming chat. messages: [{role,content}]. onDelta(text). -> teks penuh. */
export async function chat({ apiKey, model, messages, signal, onDelta, maxTokens = 8000, fallbackModels = [] }) {
  const res = await fetch(SERVER + "/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json", Authorization: `Bearer ${apiKey}`,
      ...(fallbackModels.length ? { "x-solvatra-fallback-models": fallbackModels.join(",") } : {}),
    },
    body: JSON.stringify({ model, messages, stream: true, max_tokens: maxTokens, reasoning_effort: "low", stream_options: { include_usage: true } }),
    signal,
  });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`; try { msg = (await res.json()).error?.message || msg; } catch {}
    const e = new Error(msg); e.status = res.status; throw e;
  }
  const reader = res.body.getReader(); const dec = new TextDecoder();
  let buf = "", text = "", usage = null;
  for (;;) {
    const { value, done } = await reader.read(); if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n"); buf = lines.pop() || "";
    for (const line of lines) {
      const s = line.trim(); if (!s.startsWith("data:")) continue;
      const p = s.slice(5).trim(); if (p === "[DONE]") continue;
      let j; try { j = JSON.parse(p); } catch { continue; }
      if (j.usage) usage = j.usage;
      const d = j.choices?.[0]?.delta?.content; if (d) { text += d; onDelta?.(d); }
    }
  }
  return { text, usage };
}

/** Ambil blok kode / JSON pertama dari teks model (buang basa-basi & pagar ```). */
export function extractCode(text, lang) {
  const re = lang ? new RegExp("```(?:" + lang + ")?\\s*\\n([\\s\\S]*?)```", "i") : /```[\w-]*\s*\n([\s\S]*?)```/;
  const m = String(text).match(re);
  return (m ? m[1] : String(text)).trim();
}
export function extractJson(text) {
  const body = extractCode(text, "json");
  try { return JSON.parse(body); } catch {}
  const a = body.indexOf("{"), b = body.lastIndexOf("}");
  if (a >= 0 && b > a) { try { return JSON.parse(body.slice(a, b + 1)); } catch {} }
  return null;
}

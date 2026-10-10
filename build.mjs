// Bundel UI renderer (ESM sumber + dependensi browser: pptxgenjs, docx) → renderer/dist/bundle.js
import * as esbuild from "esbuild";
const watch = process.argv.includes("--watch");
const ctx = await esbuild.context({
  entryPoints: ["renderer/app.js"],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "chrome120",
  outfile: "renderer/dist/bundle.js",
  sourcemap: watch,
  logLevel: "info",
  loader: { ".png": "dataurl" },
  define: { global: "window" },
});
if (watch) await ctx.watch(); else { await ctx.rebuild(); await ctx.dispose(); }

# Solvatra Office

Suite office ber-AI untuk **desktop** (macOS & Windows) — memakai akun, model, dan kuota
[Solvatra AI](https://solvatra.web.id). Terinspirasi GenOffice, dibangun di atas Electron.

## Yang ada sekarang (v0.1)
- **Editor Markdown** — tulis + pratinjau langsung, ekspor **.md** dan **.docx** (Word asli).
- **Editor Presentasi** — AI menyusun dek (judul + isi tiap slide); desain & tata letak dari mesin
  desain Solvatra (14 jenis slide, 9 tema), ekspor **.pptx** asli yang bisa dibuka di PowerPoint.
- **Asisten AI** di panel kanan tiap editor (streaming, model dari akun Anda).
- **Login akun Solvatra** (device flow); kunci disimpan terenkripsi di keychain OS.
- Berjalan **offline untuk dokumen** — hanya permintaan AI yang ke server.

Roadmap: editor Sheets (.xlsx), Docs kaya-format, PDF (lihat + PDF→Word), penyuntingan AI per-blok
dengan diff, dan pembaruan otomatis aplikasi.

## Unduh
Installer dibuat otomatis oleh GitHub Actions tiap rilis (tag `v*`):
- **macOS**: `.dmg` (Apple Silicon + Intel)
- **Windows**: `.exe` (NSIS)

> Aplikasi belum ditandatangani (tanpa sertifikat Apple/Microsoft). Saat pertama membuka:
> macOS → klik kanan app → **Open**; Windows → **More info → Run anyway**.

## Membangun sendiri
```bash
npm install
npm start            # jalankan aplikasi (dev)
npm run dist:mac     # buat .dmg (butuh macOS)
npm run dist:win     # buat .exe (butuh Windows, atau lewat CI)
```

## Teknologi
Electron + electron-builder · renderer di-bundle dengan esbuild · ekspor lewat
`pptxgenjs` (.pptx) & `docx` (.docx) · mesin desain slide & Markdown dipakai ulang dari Solvatra Office add-in.

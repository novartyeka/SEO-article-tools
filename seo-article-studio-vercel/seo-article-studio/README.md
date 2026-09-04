# SEO Article Studio Pro

Vite + React + Tailwind frontend dengan Vercel Functions untuk menyimpan `GEMINI_API_KEY` di server.

## Jalankan lokal

```bash
npm install
cp .env.example .env.local
# isi GEMINI_API_KEY di .env.local
npm run dev
```

Catatan: `vite` dev server tidak otomatis menjalankan folder `api/` seperti Vercel. Untuk menguji API functions secara lokal, gunakan Vercel CLI:

```bash
npm i -g vercel
vercel dev
```

## Deploy ke Vercel

1. Push folder ini ke GitHub/GitLab/Bitbucket.
2. Import repository ke Vercel.
3. Tambahkan Environment Variable `GEMINI_API_KEY` pada Project Settings → Environment Variables.
4. Deploy.

Tidak ada API key Gemini di browser. Frontend memanggil:

- `POST /api/gemini` untuk teks/SEO/article/audit/refinement.
- `POST /api/gemini-image` untuk image generation.

## Struktur

```text
seo-article-studio/
├── api/
│   ├── gemini.ts
│   └── gemini-image.ts
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
└── vite.config.ts
```

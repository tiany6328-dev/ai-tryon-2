# AI Virtual Try-On MVP

Next.js App Router + TypeScript + Tailwind CSS MVP for AI virtual try-on.

## Features

- Upload one model/person image.
- Upload one garment image.
- Validate JPG, PNG, and WebP files up to 10MB each.
- Send both files directly to `/api/tryon` as `multipart/form-data`.
- Upload files on the server with `fal.storage.upload`.
- Generate the try-on result with `fal-ai/fashn/tryon/v1.6`.
- Keep `FAL_KEY` only on the server.
- Show loading, error messages, and the generated result image.
- Deployable to Netlify.

## Project Structure

```text
.
├─ app/
│  ├─ api/
│  │  └─ tryon/route.ts
│  ├─ globals.css
│  ├─ layout.tsx
│  └─ page.tsx
├─ components/
│  └─ ImageUploader.tsx
├─ lib/
│  └─ validation.ts
├─ .env.example
├─ netlify.toml
├─ next.config.mjs
├─ package.json
├─ postcss.config.mjs
├─ tailwind.config.ts
└─ tsconfig.json
```

## Local Setup

Install dependencies:

```bash
npm install
```

Create `.env.local`:

```bash
cp .env.example .env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Fill in your fal.ai API key:

```env
FAL_KEY=your_fal_api_key
```

Start the dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Netlify Deployment

The project includes `netlify.toml`:

```toml
[build]
  command = "next build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"
```

In Netlify, configure only this server-side environment variable:

```env
FAL_KEY=your_fal_api_key
```

Do not add `NEXT_PUBLIC_` to `FAL_KEY`. It must stay server-side only.

After changing environment variables in Netlify, trigger a new deploy.

## API

### `POST /api/tryon`

Accepts `multipart/form-data`:

- `modelImage`: user/person image file
- `garmentImage`: garment image file

The server uploads both files to fal.ai storage, then calls:

```text
fal-ai/fashn/tryon/v1.6
```

Response:

```json
{
  "resultUrl": "https://..."
}
```

## Troubleshooting

If you see `Missing FAL_KEY`, add `FAL_KEY` to `.env.local` locally or to Netlify environment variables online.

If you change `.env.local`, restart `npm run dev`.

If fal.ai returns `Forbidden (403)`, check that:

- `FAL_KEY` comes from the fal.ai dashboard.
- The key is copied exactly, without adding `Key ` before it.
- The fal.ai account has available credits.
- The key can run `fal-ai/fashn/tryon/v1.6`.

If fal.ai reports an image loading or validation error, try a clear front-facing person photo and a clean garment image.

## References

- fal.ai FASHN try-on v1.6: https://fal.ai/models/fal-ai/fashn/tryon/v1.6
- fal.ai JavaScript client: https://github.com/fal-ai/fal-js
- Next.js on Netlify: https://docs.netlify.com/frameworks/next-js/overview/

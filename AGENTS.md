# Portfolio agent guide

Shared rules for Adithya's personal projects are in `../AGENTS.md`; read it first. This file adds only what is specific to the portfolio.

## Stack

React, TypeScript and Vite, prerendered to static HTML at build time (`src/entry-server.tsx`, `scripts/prerender.mjs`). Plain CSS in `src/styles.css`, no UI kit. One serverless function, `api/now-playing.js` (Spotify). Node.js 24.

## Commands

| Task | Command |
| --- | --- |
| Install | `npm ci` |
| Dev server | `npm run dev` |
| Tests | `npm test` |
| Build (type check, client, SSR, prerender into `dist`) | `npm run build` |

## Content

- `src/content.ts` holds every claim on the page; keep it in step with the resume in the adithya workspace.
- Replace `public/Adithya_Shankaran_Resume.pdf` when the resume changes.

## URLs and deploy

- Vercel project `adithya-shankaran`. Primary (canonical) URL: https://adithyashankaran.vercel.app. https://adithya-shankaran.vercel.app serves the same deployment with 200, no redirect, and must stay: it is on the resume, LinkedIn and past applications.
- Canonical, `og:url` and `og:image` in `index.html` use the primary URL. Change all three together.
- When `public/og.png` changes, bump the `?v=` date on `og:image` (LinkedIn caches images by URL) and `article:modified_time`, then re-run LinkedIn Post Inspector. `article:published_time` stays 2026-10-03 (first commit).
- No deploy on push. Deploy with the Vercel CLI from a clean `git archive` export (root skill `vercel-deploy`, details in `notes/memory_vercel_deploys.md`), then check both URLs return 200 and the same page.

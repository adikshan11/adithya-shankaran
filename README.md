# Adithya Shankaran

Personal portfolio built with React, TypeScript, Vite and Tailwind CSS, prerendered to static HTML at build time. Self-hosted Inter font, a Liquid Glass navigation bar (SVG displacement in Chromium, frosted blur elsewhere) and a light/dark theme. No UI kit or backend.

## Development

- Use Node.js 24 and install dependencies with `npm ci`.
- `npm run dev` starts the development server.
- `npm test` checks the main heading, navigation and saved theme.
- `npm run build` type-checks the project and creates the static site in `dist`.
- `npm run preview` serves the production build locally.

## Structure

- `src/App.tsx` contains the introduction, toolkit and contact details.
- `src/components` contains navigation, experience, projects and theme control.
- `src/styles.css` contains visual tokens and responsive styles.
- `src/content.ts` holds every claim on the page; keep it in step with the resume.
- Replace `public/Adithya_Shankaran_Resume.pdf` when the resume changes; it is served at `/Adithya_Shankaran_Resume.pdf`.

## Deployment

Deployed on Vercel as `adithya-shankaran` (https://adithya-shankaran.vercel.app). Build command `npm run build`, output directory `dist`. No server, database or environment variables are needed.

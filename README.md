# Adithya Shankaran

Personal portfolio built with React, TypeScript and Vite. Plain CSS, a self-hosted Inter font and a small theme control. No UI kit or backend.

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
- Replace the resume PDF at the repository root when it changes. Vite includes it in the build.

## Deployment

Import the repository into Vercel, choose the Vite preset, use `npm run build` and set the output directory to `dist`. No server, database or environment variables are needed.

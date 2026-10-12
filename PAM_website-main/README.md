
  # Contracting Business Website Design

  This is a code bundle for Contracting Business Website Design. The original project is available at https://www.figma.com/design/F6CDrEhJo5CDUeA8oFJSTD/Contracting-Business-Website-Design.

  ## Running the code

  Run `npm i` to install the dependencies.

  Use npm for this project. Commit `package-lock.json` with dependency changes; CI installs with `npm ci`. Do not add a pnpm lockfile. Vercel must use the directory containing this package.json and vercel.json as its project root.

  Run `npm run dev` to start the development server.

  For staff login, database setup, and the local portal API, follow [Local backend setup](LOCAL_BACKEND_SETUP.md).

  To try the portal without a database, run `npm run dev:demo` and open `http://127.0.0.1:5174/portal/login`. Demo credentials appear on the login page. All changes and login state reset on reload. For a hosted demo, use `npm run build:demo`. The current `vercel.json` selects this demo build. The standard `npm run build` still uses the real API.
  

## Vercel demo deployment

Push the updated source, package.json, package-lock.json, and vercel.json, then redeploy. The project root must contain these files. Install uses `npm ci`; build uses `npm run build:demo`; output is `dist`. Open `/portal/login` and use the demo accounts shown there. No database, session secret, or Blob token is needed for portal demo features.

Demo accounts are public sample accounts. Changes and uploaded photos stay in browser memory and reset on reload; visitors do not share data. Contact email remains a separate backend feature.

When ready for real staff accounts, change `vercel.json` buildCommand back to `npm run build`, follow LOCAL_BACKEND_SETUP.md / SETUP_GUIDE.md, and redeploy. A failed real login never automatically falls back to demo mode.

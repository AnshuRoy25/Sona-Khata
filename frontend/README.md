# SonaKhata frontend

React + Vite web app for SonaKhata, a shared gold ledger between jewellers and karigars.

## Setup

```bash
npm install
cp .env.example .env     # set VITE_API_URL to your backend
npm run dev              # http://localhost:5173
```

## Production build

```bash
npm run build            # output in dist/
npm run preview          # check the build locally
```

`VITE_API_URL` is baked in at build time, so set it in your hosting provider's environment
variables before building (for example `https://api.yourdomain.com/api`).

The app uses client-side routing. Rewrites to `index.html` are already set up for:

- Vercel: `vercel.json`
- Netlify: `public/_redirects`

On any other host, send every unknown path to `index.html`.

The backend must allow the frontend's domain in its CORS settings.

## Pages

| Path | Page |
|---|---|
| `/` | Home page |
| `/login` | Log in or create an account (`/login?mode=register` opens sign up) |
| `/dashboard` | Overview |
| `/orders` | All orders |
| `/orders/new` | New order (jewellers only) |
| `/orders/:id` | One order with its entries and hisaab |

## Language

The interface is available in English and Hindi. The switch is on the home page, the login page and the sidebar.
The choice is saved in the browser. All text lives in `src/lib/i18n.js`.

## Structure

```
src/
├── api/          fetch wrapper and one function per backend route
├── context/      auth, language, ledger data, assistant panel, toasts
├── hooks/        ledger loading, page titles
├── lib/          i18n text, formatting, order helpers, audio recording and playback
├── components/   layout, forms, buttons, assistant panel
└── pages/        home, login, dashboard, orders, order detail, new order
```

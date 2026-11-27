# Rizq Share: React frontend

Built with React 18, Vite and React Router.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:5173. The backend must be running on http://localhost:5000.

To point the app at a different backend (for example after deploying), copy `.env.example`
to `.env` and change `VITE_API_URL`.

## Build for production

```bash
npm run build
```

The finished site is in the `dist` folder. When you host it, make sure every URL falls back to
`index.html` (on Vercel or Netlify this is a one-line rewrite setting), otherwise refreshing
a page like /browse shows a 404.

## Structure

```
src/
  main.jsx            starts the app
  App.jsx             the list of pages (routes)
  api.js              talks to the backend
  utils.js            small helper functions
  context/            login state (AuthContext) and notifications (ToastContext)
  hooks/              useNow (shared timer), useCountUp, useDonate
  components/         Navbar, FoodCard, CountdownRing, modals, route guards
  pages/              Home, Browse, About, Contact, Auth, Dashboard, Profile, Admin
  index.css           all styling
```

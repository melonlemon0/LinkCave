# LinkFridge

Save links with thumbnails in the **cloud** (Firebase). Sign in with **Google**. **Fridge** and **Trash** tabs, **30-day trash recovery**, and **reminder nudges** (default day 3 and day 5 after save — configurable in Settings). Browser notifications work if the user allows them.

## Setup

1. **Clone and install**

   ```bash
   cd "link app"
   npm install
   ```

2. **Firebase**

   - Create a project at [Firebase Console](https://console.firebase.google.com).
   - **Authentication** → Sign-in method → enable **Google**.
   - **Firestore** → Create database (production mode is fine once rules are deployed).
   - **Project settings** (gear) → Your apps → **Web** app → copy the config values.
   - Copy `.env.local.example` to `.env.local` and paste the keys (all `NEXT_PUBLIC_FIREBASE_*` values).

3. **Firestore security rules**

   Deploy the rules in `firestore.rules` so only the signed-in user can read/write their `users/{uid}` doc and `users/{uid}/links/*`:

   ```bash
   npm install -g firebase-tools   # if needed
   firebase login
   firebase init firestore         # select this repo, use existing firestore.rules / firestore.indexes.json
   firebase deploy --only firestore
   ```

   The first time you run queries, Firebase may prompt you to create composite indexes; `firestore.indexes.json` already lists the ones used by this app (`state` + `createdAt`, `state` + `trashedAt` on `links`).

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3005](http://localhost:3005) (see `package.json` dev port), sign in with Google, then save links.

5. **PWA icons** (optional)

   Add `public/icon-192.png` and `public/icon-512.png` for install icons.

## Deploy (Vercel)

This app targets **Vercel** (Next.js is detected automatically; no `vercel.json` is required).

1. Import the Git repo in the [Vercel dashboard](https://vercel.com/new) (or run `npx vercel` / `npm run deploy` after `vercel login` from this directory).
2. In the Vercel project → **Settings** → **Environment Variables**, add the same keys as `.env.local.example` (`NEXT_PUBLIC_FIREBASE_*`, etc.).
3. In Firebase **Authentication** → **Settings** → **Authorized domains**, add your production host (e.g. `your-app.vercel.app` and your custom domain if you use one).

Production build command is the default `npm run build`; Node 18+ matches `package.json` `engines`.

## Stack

- Next.js (App Router) + Vercel
- Firebase Auth (Google) + Firestore
- Free tier friendly for early usage; scale Firestore reads/writes as you grow.

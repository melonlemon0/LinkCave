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

- Connect the repo to [Vercel](https://vercel.com).
- Add the same `NEXT_PUBLIC_FIREBASE_*` environment variables in the project settings.
- In Firebase **Authentication** → **Settings** → **Authorized domains**, add your Vercel domain (e.g. `your-app.vercel.app`).

## Stack

- Next.js (App Router) + Vercel
- Firebase Auth (Google) + Firestore
- Free tier friendly for early usage; scale Firestore reads/writes as you grow.

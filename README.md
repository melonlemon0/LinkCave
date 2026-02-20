# Link Cave

Save links in one place with thumbnails and folders. Web + mobile friendly; Google sign-in only.

## Features

- **Save links** — Paste URL, get title + thumbnail (like YouTube). No link shown after save; just thumbnail + title.
- **Folders** — Create and edit folders (name + emoji). e.g. Yoga videos 🧘, Meditation 🧘, Articles 📖, Ukulele tutorials 🎸, Blogs ✍️.
- **Grid** — 5 thumbnails per row (responsive: 2–5 columns), many rows. Drag a thumbnail onto a folder to move it.
- **One account** — Google login; sync on web and in the app (PWA / Add to Home Screen).

## Setup

1. **Clone and install**
   ```bash
   cd "link app"
   npm install
   ```

2. **Supabase**
   - Create a project at [supabase.com](https://supabase.com).
   - In SQL Editor, run `supabase/schema.sql`.
   - In Authentication → Providers, enable **Google** and add your Google OAuth client ID and secret (create OAuth credentials in Google Cloud Console; set redirect URL to `https://<project-ref>.supabase.co/auth/v1/callback`).
   - Copy project URL and anon key into `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **PWA icons** (optional)  
   Add `public/icon-192.png` and `public/icon-512.png` for install icon and splash. Any 192×192 and 512×512 PNGs (e.g. a cute cow or paw) work.

4. **Run**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). Sign in with Google, then add links and folders.

## Deploy to the world (Vercel + linkcave.org)

### 1. Deploy to Vercel

1. Push your code to GitHub (if you haven’t).
2. Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → import your repo.
3. **Root Directory:** leave default (or set to the folder that contains `package.json`).
4. **Environment Variables:** add the same ones you use locally:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**. Wait for the build to finish (you’ll get a `*.vercel.app` URL).

### 2. Add custom domain linkcave.org

1. In Vercel: your project → **Settings** → **Domains**.
2. Add **linkcave.org** (and **www.linkcave.org** if you want).
3. Vercel will show the DNS records you need (usually **A** or **CNAME**).

### 3. Point your domain to Vercel (DNS)

At the place where you manage **linkcave.org** (e.g. GoDaddy, Namecheap, Cloudflare):

- **If Vercel says to use A records:** add an **A** record for `@` (or `linkcave.org`) with the IP Vercel gives you. For **www**, add a **CNAME** for `www` → `cname.vercel-dns.com` (or what Vercel shows).
- **If Vercel says to use CNAME:** add **CNAME** for `@` (or `www`) to `cname.vercel-dns.com` (or the exact target Vercel shows).

Save, then wait 5–60 minutes. In Vercel **Domains**, the domain should turn green when it’s working.

### 4. Supabase: production URL

1. [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication** → **URL Configuration**.
2. **Site URL:** set to `https://linkcave.org` (or `https://www.linkcave.org` if you use www).
3. **Redirect URLs:** add:
   - `https://linkcave.org/**`
   - `https://linkcave.org/auth/callback`
   - If you use www: `https://www.linkcave.org/**` and `https://www.linkcave.org/auth/callback`
4. Save.

### 5. Google OAuth: allow linkcave.org

1. [Google Cloud Console](https://console.cloud.google.com) → your project → **APIs & Services** → **Credentials**.
2. Open your **OAuth 2.0 Client ID** (Web application).
3. **Authorized JavaScript origins:** add:
   - `https://linkcave.org`
   - `https://www.linkcave.org` (if you use www)
4. **Authorized redirect URIs:** you only need the Supabase callback (e.g. `https://<your-project-ref>.supabase.co/auth/v1/callback`). No need to add linkcave.org here.
5. Save.

### 6. Test

- Open **https://linkcave.org** (or https://www.linkcave.org).
- Click **Sign in with Google** and complete login.
- Add a link and a folder to confirm everything works.

## Name & domain

Service name: **Link Cave**. Production domain: **linkcave.org**.

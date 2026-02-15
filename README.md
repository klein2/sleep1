# Sleep & Wake Log

Mobile-first timestamp logger for sleep/wake events.

## 1) Environment Variables

Create `.env.local` from `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (recommended, e.g. `https://sleep-log.vercel.app`)

## 2) Supabase Setup

1. Open Supabase SQL editor.
2. Run `supabase/schema.sql`.
   - If you already ran an older schema, also run:
     - `create policy "Users can delete own events" on public.events for delete using (user_id = auth.uid());`
3. Go to `Authentication > URL Configuration` and set:
   - `Site URL`: `https://<your-vercel-domain>`
   - `Redirect URLs`:
     - `https://<your-vercel-domain>/auth/callback`
     - `https://<your-project>.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback`
4. Go to `Authentication > Settings` and set session policy:
   - `JWT expiry`: `3600` seconds (recommended 1 hour)
   - `Time-box user sessions`: `2592000` seconds (30 days)
   - `Inactivity timeout`: `2592000` seconds (30 days)
   - `Single session per user`: Off (MVP default)
5. Optional email behavior:
   - If you want instant signup/login without email confirmation, disable email confirmation.
   - If email confirmation stays enabled, users must verify mail before first login.

## 3) Run

```bash
npm install
npm run dev
```

## 4) Vercel Deployment Checklist

1. Push repository to GitHub/GitLab/Bitbucket.
2. Import project in Vercel.
3. Framework preset: `Next.js`.
4. Add Environment Variables in Vercel Project Settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL=https://<production-domain>`
5. Deploy once.
6. Copy actual production URL and ensure Supabase Auth URL settings include:
   - `Site URL` = production URL
   - `Redirect URL` includes `/auth/callback`
7. Redeploy after any env/auth URL updates.
8. Verify:
   - unauthenticated `/` and `/history` redirect to `/login`
   - sign in persists across refresh/reopen on same device
   - insert and history only show current user data

## 5) Routes

- `/login` - email/password sign in or sign up
- `/` - main logging screen (protected)
- `/history` - daily history view (protected)

## 6) Timezone Behavior

- Stored in UTC (`event_time`)
- Rendered in Asia/Seoul
- History query uses selected KST date converted to UTC range

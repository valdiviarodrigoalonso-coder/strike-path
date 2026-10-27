# Strike Path

Kickboxing lessons with a 3D coach, a round timer, and a training log for lifting, running and bag work.
It installs on your phone like an app, works offline, and syncs between devices through your own free Supabase account.

## How it fits together

| File | What it does |
|---|---|
| `src/strike-path.html` | The whole app (edit this one) |
| `tools/build.js` | Builds `index.html` and `sw.js` from the source |
| `index.html` | The built app that gets hosted |
| `sw.js` | Offline cache (built from `tools/sw.template.js`) |
| `sync.js` | Sign in, and sync your progress with Supabase |
| `config.js` | Your Supabase project URL and public key |
| `manifest.webmanifest`, `icons/` | What makes it installable, with its home-screen icon |
| `vendor/` | Local copies of three.js (r128) and supabase-js (2.45.4) so it works offline |
| `supabase/schema.sql` | The database table and privacy rules |
| `img/ex/` | Exercise photos, start (`-0`) and finish (`-1`), from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain) |

Your data is saved on the device first, every time. When you're signed in and online it also saves to your account;
offline changes upload when the connection comes back. The newer copy wins.

## One-time setup

### 1. Supabase (free login and sync)
1. Create a free account at supabase.com and a new project (any name, pick a region near you).
2. In the project: **SQL Editor → New query**, paste everything from `supabase/schema.sql`, and click **Run**.
   Do the same with `supabase/transfer.sql` to turn on short transfer codes.
3. **Project Settings → API**: copy the **Project URL** and the **anon public** key into `config.js`.
4. **Authentication → Sign In / Providers → Email**: turn **Confirm email** off. Then "Create account" signs you in
   straight away. With it on, every new account has to click an emailed link first, and Supabase's free mailer only
   sends a few emails an hour.
5. **Authentication → URL Configuration**: set **Site URL** to the address where you host the app (step 2 below),
   and add the same address under **Redirect URLs**, so email links (confirmations, password resets) open the app.

### 2. Free hosting (GitHub Pages)
1. Run `node tools/build.js`.
2. Put this folder in a GitHub repository and push it.
3. In the repository: **Settings → Pages → Deploy from a branch → main / root**.
4. Your app will be at `https://<your-username>.github.io/<repo-name>/`.

### 3. Install it on your phone
- **iPhone (Safari):** open the address → Share → **Add to Home Screen**.
- **Android (Chrome):** open the address → menu → **Install app**.

Then tap **Save my progress** (under your rank, or on the Profile tab) and create your account. Use the same account on your computer.
Forgot your password? Tap **Sign in → Forgot password?** and the emailed link lets you pick a new one.

### Moving your progress
- **Between devices running the app:** sign in to sync on both. Or, without an account, use a short code:
  **Profile → Get a code** on one device (like `K7Q-4MZ`), then type it under
  **Got a code from your other device?** on the other. Codes work once and expire after an hour.
- **From the Claude-hosted page:** **Profile → Open in the Strike Path app**. The app opens with your progress
  and asks before bringing it in. Do this on the computer, sign in there, and your phone gets it through sync.
- A long copy-and-paste backup code is still under **Long backup code**, for the same device.

## Making changes
1. Edit `src/strike-path.html`.
2. Run `node tools/build.js`.
3. Commit and push. The app picks up the new version the next time it opens online.

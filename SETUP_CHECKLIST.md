# Setup checklist – what you need to do

Everything on this list is something you do yourself (accounts, dashboards, env files, deploy steps). The code is already in place.

---

## 1. Supabase project

- [ ] Go to [supabase.com](https://supabase.com) and sign in (or create an account).
- [ ] Create a new project: pick org, name, database password, region.
- [ ] Wait for the project to finish provisioning.

---

## 2. Run the database migration

- [ ] In the Supabase Dashboard, open **SQL Editor**.
- [ ] Open the file `supabase/migrations/001_initial.sql` in this repo and copy its full contents.
- [ ] Paste into the SQL Editor and run it. This creates the `person`, `outreach`, and `user_push_tokens` tables and RLS policies.

---

## 3. Get your Supabase API keys

- [ ] In Supabase Dashboard go to **Project Settings** (gear) → **API**.
- [ ] Copy:
  - **Project URL**
  - **anon public** key (under "Project API keys")

---

## 4. Create `.env` in the project root

- [ ] Copy the file `.env.example` to a new file named `.env` (in the same folder as `package.json`).
- [ ] In `.env`, set:
  - `EXPO_PUBLIC_SUPABASE_URL` = your Project URL (e.g. `https://xxxxx.supabase.co`).
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = your anon public key.
- [ ] Do not commit `.env` (it’s in `.gitignore`).

---

## 5. (Optional) Email auth settings

If you use Supabase email sign up:

- [ ] In Dashboard: **Authentication** → **Providers** → **Email**. Confirm "Enable Email Signup" is on if you want sign up.
- [ ] For production you may want to configure **Authentication** → **Email Templates** and/or a custom SMTP (Project Settings → **Auth** → SMTP) so verification emails don’t go to spam.

---

## 6. Run the app locally

- [ ] In the project root: `npm install` (if you haven’t already).
- [ ] Run `npx expo start`.
- [ ] Open on a device/simulator (e.g. press `i` for iOS simulator, `a` for Android, or scan QR with Expo Go).
- [ ] Sign up with an email and password and confirm the app loads and you can add/import people.

---

## 7. Push notifications (optional)

For "Time to check in with [Name]" push notifications to work, you need: (A) the app to get a push token and send it to Supabase, and (B) a job that runs daily and sends reminders. Walkthrough below.

### 7A. Expo project ID (for push tokens in production)

Push tokens from Expo require a project ID. You get this when you use EAS.

1. Create an Expo account at [expo.dev](https://expo.dev) if you don’t have one.
2. Install EAS CLI: `npm install -g eas-cli`
3. Log in: `eas login`
4. In your project folder run: `eas init`
   - Choose your Expo account and (when asked) create/link a project. This writes an `extra.eas.projectId` (or similar) into `app.json` / `app.config.js`.
5. Find the project ID:
   - Go to [expo.dev](https://expo.dev) → your account → Projects → **forgetmenot** (or the name you gave). The project ID is in the URL or on the project settings page (e.g. `abc123de-f456-7890-...`).
6. Add it to `.env`:  
   `EXPO_PUBLIC_PROJECT_ID=your-project-id-here`  
   (Replace with the actual ID. This is used when the app calls `getExpoPushTokenAsync` so Expo knows which project the token belongs to.)

**Note:** In **Expo Go** (development), push often works without this. For a **standalone build** (EAS Build or store build), you need the project ID in `.env` so the built app can register for push.

---

### 7B. Deploy the reminder Edge Function

This function finds people who are due and sends push notifications to your device(s).

1. **Install Supabase CLI** (if needed):  
   `npm install -g supabase`  
   Or: [Supabase CLI install](https://supabase.com/docs/guides/cli#install-the-supabase-cli).

2. **Log in:**  
   `supabase login`  
   A browser window opens; sign in with your Supabase account.

3. **Link the repo to your Supabase project:**
   - In Supabase Dashboard open your project.
   - The **project ref** is in the URL: `https://app.supabase.com/project/YOUR_PROJECT_REF`  
     Or: **Project Settings** → **General** → **Reference ID**.
   - In your project folder run:  
     `supabase link --project-ref YOUR_PROJECT_REF`  
     (Replace `YOUR_PROJECT_REF` with that value.)  
   - If asked, enter your database password.

4. **Deploy the function:**  
   `supabase functions deploy send-due-reminders`  
   When it finishes, the CLI prints the function URL, or you can get it from:  
   **Supabase Dashboard** → **Edge Functions** → **send-due-reminders** → copy the **URL** (e.g. `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-due-reminders`).

5. **Optional – set a secret (for cron):**  
   If you’ll call this URL from an external cron, you can require a secret header so random people can’t trigger it:
   - Dashboard → **Edge Functions** → **send-due-reminders** → **Secrets** (or **Settings**).
   - Add a secret, e.g. `CRON_SECRET`, and set a long random value.  
   Then you’d need to update the function code to check that header (the current code doesn’t; add it if you use a secret).

---

### 7C. Schedule the function (daily reminders)

The function must be **called once per day** (e.g. 9:00) so it runs and sends "Time to check in with …" to users who have due people.

**Option 1 – External cron (e.g. cron-job.org)**

1. Go to [cron-job.org](https://cron-job.org) (or similar) and create a free account.
2. Create a new cron job:
   - **URL:** the Edge Function URL from 7B step 4 (e.g. `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-due-reminders`).
   - **Schedule:** once per day at the time you want (e.g. 9:00 AM in your timezone).
   - **Request:** GET or POST; no body needed unless you add auth (e.g. a header with your `CRON_SECRET`).
3. Save. The service will call your function on that schedule.

**Option 2 – GitHub Actions**

1. In your repo create `.github/workflows/daily-reminders.yml` (or add to an existing workflow).
2. Example that runs once per day at 9:00 UTC:

   ```yaml
   name: Daily reminders
   on:
     schedule:
       - cron: '0 9 * * *'
   jobs:
     run:
       runs-on: ubuntu-latest
       steps:
         - name: Call send-due-reminders
           run: |
             curl -X POST "${{ secrets.SUPABASE_FUNCTION_URL }}"
   ```

3. In the repo: **Settings** → **Secrets and variables** → **Actions** → add a secret `SUPABASE_FUNCTION_URL` with the full function URL. If you added a `CRON_SECRET`, send it in a header and update the function to check it.

**Option 3 – pg_cron (inside Supabase)**

If your Supabase plan includes **pg_cron**:

1. In Dashboard: **Database** → **Extensions** → enable **pg_cron**.
2. You need a way for Postgres to call an HTTP URL (e.g. **pg_net** extension if available, or a small Supabase Edge Function that runs on a schedule). Supabase’s “scheduled functions” or “cron” feature (if available in your region/plan) can be configured to invoke `send-due-reminders` daily—check **Edge Functions** or **Database** docs for “scheduled” / “cron” in your dashboard.

Once 7A–7C are done, the app can register for push (with project ID in production), and your daily job will send reminder notifications; tapping one opens Messages (if the person has a number) and the app.

---

## 8. Production / app store (optional)

When you’re ready to put the app on TestFlight (iOS) or the Play Store (Android), you do the following on your side.

### 8A. Accounts and access

- **iOS (TestFlight / App Store):** You need an **Apple Developer Program** account ($99/year). Sign up at [developer.apple.com](https://developer.apple.com).
- **Android (Play Store):** You need a **Google Play Console** account (one-time fee, often $25). Sign up at [play.google.com/console](https://play.google.com/console).

### 8B. EAS Build and Submit (Expo)

Expo’s EAS (Expo Application Services) builds your app in the cloud and can submit to the stores.

1. **Install and log in (if you haven’t):**  
   `npm install -g eas-cli`  
   `eas login`

2. **Configure the project for EAS:**  
   In the project folder run:  
   `eas build:configure`  
   This creates or updates `eas.json` and may update `app.json` (e.g. with build profiles).

3. **Build for iOS and/or Android:**
   - iOS: `eas build --platform ios --profile production` (or the profile you use for store builds).
   - Android: `eas build --platform android --profile production`.
   - First time, EAS will ask you to create/link an Apple Developer account and/or Google Play account and set up credentials (signing keys, etc.). Follow the prompts; EAS can generate and store keys for you.

4. **Submit to the stores:**
   - After a build succeeds, submit with:
     - iOS: `eas submit --platform ios --profile production` (and choose the latest build, or point to a build ID).
     - Android: `eas submit --platform android --profile production`.
   - You’ll need:
     - **iOS:** App Store Connect app record (bundle ID, name, etc.) and optionally TestFlight for beta.
     - **Android:** A Play Console app (package name, store listing, etc.).

5. **Store listings and compliance:**  
   In App Store Connect and Google Play Console you fill in:
   - App name, description, screenshots, privacy policy URL.
   - Any questionnaires (e.g. data collection, encryption).
   - Pricing (free/paid) and countries.

Full step-by-step and troubleshooting: [Expo – Submit to app stores](https://docs.expo.dev/submit/introduction/) and [EAS Build](https://docs.expo.dev/build/introduction/).

---

## Quick reference

| What              | Where / how |
|-------------------|-------------|
| Supabase URL      | Dashboard → Project Settings → API → Project URL |
| Supabase anon key | Dashboard → Project Settings → API → anon public |
| Run migration     | Dashboard → SQL Editor → paste `supabase/migrations/001_initial.sql` → Run |
| `.env`            | Project root; copy from `.env.example` and fill in URL + anon key |
| Edge Function URL | After deploy: Dashboard → Edge Functions → `send-due-reminders` → URL |

Once 1–4 and 6 are done, you can use the app locally with auth and sync. Push (7) is optional.

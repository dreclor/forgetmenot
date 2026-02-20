# Steps left to do

You’ve done: Supabase project, migration, API keys, `.env`, running the app, 7A (Expo project ID), and 7B (deploy Edge Function). Here’s what’s left.

---

## 7C. Schedule the reminder function (GitHub Actions)

The workflow is already in the repo (`.github/workflows/daily-reminders.yml`). It runs every day at 9:00 AM UTC and calls your Supabase Edge Function. You just need to put the project on GitHub and add the function URL as a secret.

### 1. Put the project on GitHub

1. Create a new repo at [github.com/new](https://github.com/new) (e.g. name it `forgetmenot`). Don’t add a README or .gitignore if the project already has one.
2. In your project folder, if it’s not already a git repo, run:
   ```bash
   git init
   ```
3. Add the remote and push (replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub repo):
   ```bash
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

### 2. Add the function URL as a secret

1. Open your repo on GitHub → **Settings** → **Secrets and variables** → **Actions**.
2. Click **New repository secret**.
3. **Name:** `SUPABASE_REMINDERS_FUNCTION_URL`
4. **Value:** your Edge Function URL (Supabase Dashboard → **Edge Functions** → **send-due-reminders** → copy the URL). It looks like:
   `https://hsotmvmsxfsdtgveyhiy.supabase.co/functions/v1/send-due-reminders`

### 3. Confirm it works

- Go to the repo → **Actions** tab. You’ll see the “Daily reminders” workflow.
- To test without waiting for 9:00 UTC: open the workflow, click **Run workflow** → **Run workflow**. It should complete and call your function.

After that, the workflow runs automatically every day at 9:00 AM UTC. To change the time, edit the `cron` line in `.github/workflows/daily-reminders.yml` (e.g. `0 14 * * *` = 2:00 PM UTC).

---

## Optional

- **5. Email auth** – In Supabase: **Authentication → Providers → Email** (enable signup, templates, or SMTP if you want better deliverability).
- **8. App store** – When you’re ready: Apple Developer / Play Console accounts, then EAS Build and Submit (see full checklist section 8).

---

Once **7C** is done, daily reminder push notifications will run automatically.

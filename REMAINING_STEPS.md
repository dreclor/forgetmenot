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

### 2. Add secrets for the workflow

1. Open your repo on GitHub → **Settings** → **Secrets and variables** → **Actions**.
2. Add two repository secrets:
   - **Name:** `SUPABASE_REMINDERS_FUNCTION_URL`  
     **Value:** your Edge Function URL (Supabase Dashboard → **Edge Functions** → **send-due-reminders** → copy the URL). Example: `https://xxxxx.supabase.co/functions/v1/send-due-reminders`
   - **Name:** `SUPABASE_ANON_KEY`  
     **Value:** your Supabase anon (public) key (Supabase Dashboard → **Project Settings** → **API** → **anon public**). The workflow sends this in the `Authorization` header so the function accepts the request.

### 3. Confirm it works

- Go to the repo → **Actions** tab. You’ll see the “Daily reminders” workflow.
- To test without waiting for 9:00 UTC: open the workflow, click **Run workflow** → **Run workflow**. It should complete and call your function.

After that, the workflow runs automatically every day at 9:00 AM UTC. To change the time, edit the `cron` line in `.github/workflows/daily-reminders.yml` (e.g. `0 14 * * *` = 2:00 PM UTC).

---

## Testing the reminder flow

To confirm push notifications work end-to-end:

1. **Have at least one person** in the app (add or import someone).
2. **Register for push:** Open the app on a **real device** (not simulator), log in, and grant notification permission when prompted. That saves your push token to Supabase.
3. **Make someone due:** Open that person’s detail screen → tap **“Make due now (test)”**. Their next reminder is set to the past so the function will include them.
4. **Trigger the workflow:** GitHub → your repo → **Actions** → **Daily reminders** → **Run workflow** → **Run workflow**.
5. **Check:** Within a minute you should get a push: “Time to check in with [Name].” Tapping it should open Messages (if they have a phone) and the app.

If you don’t get a push: confirm the workflow run succeeded (green check, Status 200), then check Supabase → **Edge Functions** → **send-due-reminders** → **Logs** for that run.

---

**Troubleshooting (green check but no notification):** Check the workflow step output for **Response**. If `dueCount: 0`, no one is due—use "Make due now (test)" in the app, then run the workflow again. If `dueCount` > 0 but `sent: 0`, your push token isn't saved—enable push in Settings and check Supabase Table Editor → **user_push_tokens**. Redeploy the function (`npm run supabase:deploy-functions`) to see logs in Supabase → Edge Functions → send-due-reminders → Logs.

---

## Optional

- **5. Email auth** – In Supabase: **Authentication → Providers → Email** (enable signup, templates, or SMTP if you want better deliverability).
- **8. App store** – When you’re ready: Apple Developer / Play Console accounts, then EAS Build and Submit (see full checklist section 8).

---

Once **7C** is done, daily reminder push notifications will run automatically.

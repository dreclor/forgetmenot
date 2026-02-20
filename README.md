# Forget Me Not

Stay in touch with the people who matter. Import contacts, set how often you want to be reminded to check in, and get nudges with ideas and one-tap actions.

## Setup

### 1. Supabase

- Create a project at [supabase.com](https://supabase.com).
- In the SQL Editor, run the migration in `supabase/migrations/001_initial.sql`.
- In Project Settings > API: copy the **Project URL** and **anon public** key.

### 2. Environment

Copy `.env.example` to `.env` and set:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Optional for push notifications (EAS): set `EXPO_PUBLIC_PROJECT_ID` to your Expo project ID from app.json / EAS.

### 3. Run the app

```bash
npm install
npx expo start
```

Then run on iOS simulator, Android emulator, or scan the QR code with Expo Go.

### 4. Push reminders (optional)

To send daily due reminders:

- Deploy the Edge Function: `supabase functions deploy send-due-reminders`.
- Schedule it (e.g. daily at 9am) via Supabase Dashboard (Database > Extensions > pg_cron) or an external cron calling the function URL with a cron secret.

## Features

- **Auth** – Sign up / sign in with email.
- **Import contacts** – Tinder-style flow: swipe Add/Skip, pick reminder frequency per person.
- **People list** – See everyone with due status (overdue, due soon, upcoming).
- **Dashboard** – Due/overdue cards with 3 suggestion ideas, “I already did”, “Snooze”, and “Add to calendar”.
- **Person detail** – View, “I reached out”, suggestions, Add to calendar.
- **Push notifications** – “Time to check in with [Name]”. Tap opens Messages to that person (if phone saved) and the app to their card.
- **Calendar** – “Add to calendar” creates a “Check in with [Name]” event on the device calendar.

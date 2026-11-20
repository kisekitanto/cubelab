# CubeLab + Supabase setup

This project uses the Supabase JavaScript v2 CDN client and keeps the existing
plain HTML/CSS/JavaScript app. No build step or server is required.

## 1. Create your Supabase project

Create a project in the Supabase Dashboard. From **Project Settings → API**
(or the API keys page), copy the **Project URL** and **publishable key**. The
legacy `anon` key is also accepted. Do not use a `service_role` or secret key
in browser code.

## 2. Create the private data table

Open **SQL Editor**, paste the contents of `supabase-setup.sql`, and run it.
The script creates `public.cubelab_data`, enables RLS, and grants authenticated
users access only to the row whose `user_id` matches their signed-in account.

## 3. Add the browser config

Edit `supabase-config.js`:

```js
window.CUBELAB_SUPABASE = {
  url: "https://YOUR_PROJECT_REF.supabase.co",
  publishableKey: "YOUR_SUPABASE_PUBLISHABLE_KEY"
};
```

Replace both placeholder values with your own values from Supabase. The
publishable key is meant to be visible in browser apps; RLS is what protects
the data. Never paste a service-role key into this file or into GitHub.

## 4. Configure email redirects

In **Authentication → URL Configuration**, set the Site URL to your published
CubeLab URL and add that same URL to the Redirect URLs allow list. Use your own
GitHub Pages address. Supabase may require users to click an email confirmation
link after registration, depending on the project's email-confirmation settings.

## 5. Publish and test

Publish `index.html`, `app.js`, `style.css`, `supabase-config.js`, and the other
project files together. Open the site, select **Account**, create an account,
then log in. Complete a test solve and change a theme; the Account screen should
show a successful sync. Open CubeLab on another device, log in to the same
account, and select **Sync now**.

## What is saved

CubeLab syncs its current backup data bundle: solves (times, scrambles, notes,
penalties and split times), saved scrambles, completed lessons, trainer
progress, custom algorithms, timer settings, themes, and practice-day history.
The local browser copy remains in place.

## Important behavior

- Each user owns one row in `cubelab_data`; RLS prevents access to other users'
  rows.
- Signed-in changes are uploaded automatically after a short delay.
- **Sync now** downloads and merges cloud data into the current browser, then
  uploads the merged result.
- When a different account is used on the same browser, CubeLab loads that
  account's data without merging the previous account's local data into it.
- This first version does not provide live, instant multi-device updates. Use
  **Sync now** on the other device to pull recent changes.

# Lakbay Lokal deployment guide

This guide uses a new GitHub repository, a Supabase project, and a Vercel project for Lakbay Lokal. Keep these separate from Bohol Beacon and Cebu Current so their databases, credentials, and deployments cannot get mixed up.

## 1. Put the project in your GitHub account

1. Open the `Lakbay-Lokal` folder in File Explorer.
2. Create a new repository in the GitHub account you want to use. A suitable name is `lakbay-lokal`.
3. Keep the repository private if you prefer the project source to stay private.
4. In GitHub Desktop (or your usual Git tool), add this existing local folder and publish it to the new repository. Do not add `.env`, `.env.local`, or any Supabase key.
5. Check the repository’s file list. It should include `.env.example`, but no real `.env` file.

## 2. Create a separate Supabase project

1. Sign in to the Supabase account you want to use for this site.
2. Choose **New project** and create a project named `lakbay-lokal`.
3. Choose the region closest to the people who will use the site. For a Philippines-focused class project, Singapore is a reasonable choice.
4. Create a strong database password and save it in your password manager. Do not put this database password in the website’s `.env.local`.
5. Wait until Supabase finishes provisioning the project.
6. In the project, open **SQL Editor** and create a new query.
7. Open `supabase/schema.sql` from this folder, copy all of its contents into the SQL Editor, and click **Run**.
8. Confirm the query completes successfully. The script creates this site’s profile, login-guard, and security-event tables and the functions used by the sign-in protection. It is intended for a new Lakbay Lokal project; do not run it in the Bohol Beacon or Cebu Current database.
9. In Supabase, open **Project Settings → API** (the exact menu label may vary). Copy the project URL and the publishable key.
10. Copy the project’s secret API key for server-side use. Keep it private; do not use it in browser code, commit it, or send it in chat.

## 3. Configure the local environment

1. In the project folder, make a copy of `.env.example` named `.env.local`.
2. Fill in these values using the new Lakbay Lokal Supabase project:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
   SUPABASE_SECRET_KEY=YOUR_SECRET_KEY
   ADMIN_EMAILS=your-verified-admin-email@example.com
   ```

3. Replace the example values with your own. `ADMIN_EMAILS` can contain more than one email, separated by commas. Use the email address you will sign up with as the administrator.
4. Save the file. `.env.local` is ignored by Git; do not remove that protection.
5. In a terminal opened in this folder, run `npm install`, then `npm run dev`.
6. Open the local URL printed by Next.js. The guide should load even before Supabase is configured. Sign-up and sign-in should become available when the environment values are present.

## 4. Configure Supabase email verification URLs

1. In Supabase, open **Authentication → URL Configuration**.
2. Set **Site URL** to your eventual Vercel production URL, such as `https://lakbay-lokal.vercel.app` after Vercel assigns it.
3. Add these redirect URLs:
   - `http://localhost:3000/auth/callback`
   - `https://YOUR-VERCEL-DOMAIN/auth/callback`
   - If you use a custom domain, also add `https://YOUR-CUSTOM-DOMAIN/auth/callback`.
4. Save the URL configuration.

You can update the production URL after Vercel creates the project. The local URL is for development only.

## 5. Import the GitHub repository into Vercel

1. Sign in to the Vercel account you want to use for Lakbay Lokal.
2. Choose **Add New → Project**.
3. Connect the GitHub account that owns the new repository. If the repository is not listed, use the GitHub App permissions screen to grant access to this repository only.
4. Select the `lakbay-lokal` repository and choose **Import**.
5. Keep the detected Next.js framework settings. The project root should be the repository root.
6. Before deploying, open **Environment Variables** and add the following values to **Production**, **Preview**, and **Development** as appropriate:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
   - `ADMIN_EMAILS`
7. Use the values for the new Lakbay Lokal Supabase project. Do not copy Bohol Beacon or Cebu Current credentials.
8. Click **Deploy** and wait for the build to finish.
9. Copy the production domain Vercel assigns.
10. Return to Supabase **Authentication → URL Configuration**. Set the Site URL to that production domain and add its `/auth/callback` redirect URL. Save.
11. If you changed environment variables after the first deployment, open **Deployments**, redeploy the latest production build, and confirm the build is ready.

## 6. Create and designate your admin account

1. Make sure your chosen email is listed in the Vercel `ADMIN_EMAILS` environment variable. Use lowercase and no extra spaces; for multiple admins, separate addresses with commas.
2. Open the production site and create an account using that email and a strong, unique password.
3. Open the verification email and follow its link back to Lakbay Lokal.
4. Sign in after the site reports the email is verified.
5. Confirm the header shows **Admin desk**. If it does not, check that the email exactly matches `ADMIN_EMAILS`, check the Production environment scope, and redeploy after editing the variable.

Admin status is based on the server-side `ADMIN_EMAILS` setting. No admin email or password is hard-coded in the source.

## 7. Check the account security flow

Use a test account you own. Do not test against another person’s email.

1. Create and verify a normal reader account.
2. Sign in to the admin account in a regular browser profile and open **Admin desk**.
3. Use a separate browser profile or an incognito window to try one incorrect password for the normal reader account.
4. Confirm that the reader’s **My alerts** shows the failed attempt while signed in, and the admin’s **Admin desk** shows the attempted reader email and available IP, approximate location, and browser details. The admin feed refreshes while open.
5. If you continue, the third incorrect password pauses sign-in for that email for five minutes. Attempts during the pause are also recorded. Avoid repeated testing against a real account you need to use immediately.
6. Remember that IP location can be approximate or wrong, browser information can be spoofed, and websites cannot read MAC addresses.

## Troubleshooting

- **Sign-in protection unavailable:** Confirm the schema ran in the Lakbay Lokal Supabase project and that the Vercel `SUPABASE_SECRET_KEY` is its secret API key. Redeploy after changing an environment variable.
- **Account service unavailable:** Check the project URL and publishable key, then review Vercel Runtime Logs for the API route error.
- **Verification link does not return to the site:** Check the Supabase Site URL and allowed `/auth/callback` redirect URLs.
- **Admin desk is missing:** Confirm the signed-in email exactly matches `ADMIN_EMAILS` in Vercel Production, then redeploy.
- **Admin desk shows a retrieval error:** Check the Supabase secret key and confirm the `lakbay_security_events` table exists. The Admin desk is separate from **My alerts**, which lists only the signed-in account’s attempts.

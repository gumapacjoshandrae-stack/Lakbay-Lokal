# Lakbay Lokal

A postcard-inspired, slow-travel pocket guide to Cebu, Bohol, and nearby islands in Central Visayas. Place cards link to local and official tourism resources; the site does not book travel or claim that live schedules, prices, or access details are guaranteed.

## Reader accounts and security

Optional Supabase accounts provide email verification, a five-minute pause after three wrong passwords, private in-site account alerts, and a separate admin activity feed across all reader accounts. The admin list refreshes while open. It records an approximate IP location and browser details; websites cannot read a visitor’s MAC address or guarantee an exact location.

## Run locally

1. Install Node.js LTS.
2. Open a terminal in this folder and run `npm install`.
3. Copy `.env.example` to `.env.local` and add credentials from your own Supabase project.
4. Run the SQL in `supabase/schema.sql` in that new Supabase project’s SQL Editor.
5. Run `npm run dev` and open the local URL shown in the terminal.

The travel guide works without Supabase. Accounts and security tools require Supabase configuration. See [DEPLOY.md](./DEPLOY.md) for the full GitHub, Supabase, and Vercel steps.

Never commit `.env.local`, `.env`, or Supabase secret keys.

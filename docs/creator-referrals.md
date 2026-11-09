# Creator referral program

Link: `https://opensport.app/?ref=<code>` → registration → first video within 14 days of the first visit → pending activation → admin approves → payout.

## Launch checklist

1. Run `supabase/migrations/20261108_creator_referrals.sql` in the SQL editor (safe to re-run).
   It needs `public.users` and `public.videos`. `public.match_analyses` is optional: if it is created
   later, re-run this file so match uploads also count. (Applied to production on 2026-11-09,
   before match_analyses existed there.)
2. Optional: run `supabase/tests/creator_referrals_smoke.sql`. It plays the whole flow and rolls back;
   the last line should say `all checks passed`.
3. Make yourself an admin:
   ```sql
   INSERT INTO public.admin_users (auth_user_id, note)
   SELECT id, 'referral admin' FROM auth.users WHERE email = 'you@example.com';
   ```
4. Redeploy the Edge Function: `supabase functions deploy register`.
5. Deploy the frontend. The panel is at `/admin/referrals` (not linked in the navbar; others get a 404).
   Referral links use `VITE_PUBLIC_SITE_URL`, default `https://opensport.app`.

## Rules

- **Attribution**: first touch. The first valid link is kept in localStorage; another creator's link does not replace it. The account is linked once, at registration, and never changes.
- **Window**: 14 days from the first visit (server time), checked at registration and at the first upload.
- **Activation**: created by a database trigger on the first row in `videos` (kick and duel uploads) or `match_analyses`. Later uploads never create another one.
- **Creator status**: `paused` stops new visits and new registrations; already linked users can still activate. `blocked` also stops new activations.
- **Review**: pending ⇄ approved ⇄ rejected (a rejection needs a reason). `paid` is final.
- **Reward**: 1–10 → 250 ₸, 11–25 → 300 ₸, 26–50 → 400 ₸, 51+ → 500 ₸ per approved activation, counted over the creator's lifetime.
- **Cap**: a lifetime limit on everything paid to the creator (default 15 000 ₸, which is reached at the 45th activation). Approved activations over the cap wait until the cap is raised.
- **Payout**: "Mark as paid" pays the oldest unpaid approved activations that fit under the cap, stores each activation's rate, and links them to the payout so they cannot be paid twice.

## Where things are

| | |
|---|---|
| Schema, functions, triggers | `supabase/migrations/20261108_creator_referrals.sql` |
| `?ref=` capture | `src/lib/referral.ts` (started in `App.tsx`) |
| Linking at sign-up | `supabase/functions/register` → `attach_referral` |
| Admin panel | `src/pages/admin/AdminReferrals.tsx`, `src/components/admin/referrals/*`, `src/hooks/useAdminReferrals.ts` |

Clients cannot read the referral tables. Everything goes through `SECURITY DEFINER` functions: `track_referral_visit` (anon), `attach_referral` (service role) and `admin_*` (which check `is_admin()`).

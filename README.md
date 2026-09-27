# Kaju Koi website (preview)

Static site in `site/` (built from `src/` with `build.py`), backend is a Supabase Edge Function.

- Build: `python3 build.py` (needs Pillow) -> writes `site/*.html`
- Local preview: `python3 -m http.server 8787 --directory site` -> http://localhost:8787/
- Forms POST to the Supabase Edge Function `submit` (project `kaju-koi`, ref `rekeliwflholllekqias`, region ap-south-1).
  Source: `supabase/functions/submit/index.ts`. Tables `public.orders` and `public.enquiries`
  are RLS-locked (no public read/write); the function inserts with the service role and emails
  the owner via Resend. Notification settings live in `private.config` (not exposed to the API).
- Test submissions: any name starting with `TEST` is flagged `is_test = true` and the email subject gets `[TEST]`.
- Placeholders to fill: search the site for `class="ph"` and `whatsappNumber` in `site/js/config.js`.

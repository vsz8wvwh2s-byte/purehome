# Guest quote request launch requirements

The public quote form must stay disabled until a secure server-side submission endpoint is deployed and tested.

- Use a Supabase Edge Function to validate and save guest submissions. Never expose service-role credentials in browser code.
- Require server-verified anti-bot protection and rate limiting. Fail closed if anti-bot configuration is missing.
- Validate customer contact details, address, preferred date, active service and description. Apply size limits.
- Keep the quote_requests table private with row-level security; no anonymous SELECT, UPDATE or direct INSERT.
- Only return success after a verified database write; show a clear failure otherwise.
- Add optional photo uploads through private storage with size/type restrictions and owner-only read access.
- Test owner access and guest denial, invalid inputs, repeated submissions, successful writes and errors before launch.
- Do not enable Stripe charges until custom quote acceptance and full upfront payment confirmation are verified.

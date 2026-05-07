
 # Campus Guide Post UTME UI

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Credo payment setup

The app now uses a Credo-first payment flow:

1. The dashboard opens a Credo checkout for `pdf` or `cbt`.
2. `create-credo-payment` initializes the transaction and redirects the user to Credo.
3. Credo sends a webhook to `credo-webhook`.
4. The webhook verifies the transaction and updates `user_access` directly.
5. The frontend confirmation page polls `user_access` and unlocks the purchased product automatically.

### Required Supabase Edge Functions

- `supabase/functions/create-credo-payment`
- `supabase/functions/credo-webhook`

### Required environment variables

Set these in your Supabase project secrets:

- `CREDO_PUBLIC_KEY`
- `CREDO_SECRET_KEY`
- `CREDO_WEBHOOK_TOKEN`
- `CREDO_BASE_URL` (`https://api.credodemo.com` for sandbox, `https://api.credocentral.com` for production)
- `PUBLIC_SITE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` (optional, for confirmation emails)
- `WHATSAPP_NUMBER` (optional, used in confirmation emails)

### Required database change

Apply the migration in:

- `supabase/migrations/20260507_create_processed_webhooks_table.sql`

### Credo dashboard configuration

- Set your webhook URL to your deployed `credo-webhook` function URL.
- Set your callback/redirect base URL to your live frontend domain.
- Use the same live `PUBLIC_SITE_URL` value you configure in Supabase.
  

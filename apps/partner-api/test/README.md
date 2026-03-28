# Partner API Test Bench

This folder contains a deterministic database test bench for `partner-api`.

## What it seeds
- `auth_otps`, `auth_sessions`, `auth_users`
- `settings`
- `links`
- `clicks`
- `transactions`
- `conversions`

## Environment sets
- Local:
  - `LOCAL_TEST_EMAIL_1`
  - `LOCAL_TEST_EMAIL_2`
  - `LOCAL_TEST_EMAIL_3`
- Staging:
  - `STAGING_TEST_EMAIL_1`
  - `STAGING_TEST_EMAIL_2`
  - `STAGING_TEST_EMAIL_3`

## Important note
- The original request listed `test1@gmail.com` twice for local.
- `auth_users.email` is unique, so the example env uses `test2@gmail.com` for `LOCAL_TEST_EMAIL_2`.
- If you really need a different second local address, replace the env value and regenerate.

## Generated outputs
- `partner-testbench.local.sql`
- `partner-testbench.staging.sql`

## Usage
No setup copy step is required.

The generator works automatically in this order:
1. `process.env`
2. `test/.env` if present
3. built-in defaults

That means the default local and staging email sets already work out of the box.

Generate only:
1. Run `npm run testbench:generate`.

Apply end-to-end:
1. Local: `npm run testbench:apply:local`
2. Staging: `npm run testbench:apply:staging`

Automatic ensure behavior:
- Local startup (`npm run dev`) now runs `testbench:ensure:local` after migrations.
- Staging deploy (`npm run deploy:staging`) now runs `testbench:ensure:staging` after migrations and before deploy.
- The ensure step checks whether the expected seeded users and their bench data are already present in the correct order.
- If the bench is missing or drifted, it reapplies the generated SQL automatically.
- Seed SQL is targeted to the test-bench identities so email collisions are refreshed instead of failing on unique constraints.

Manual SQL apply is still available if needed:
- Local: `wrangler d1 execute AUTH_DB --local --file=./test/partner-testbench.local.sql`
- Staging: `wrangler d1 execute AUTH_DB --remote --env staging --file=./test/partner-testbench.staging.sql`

## Seed profile
- User 1:
  - 70 days
  - 1,000 clicks
  - 3 links
  - 100,000 USD attributed conversions
- User 2:
  - 90 days
  - 10,000 clicks
  - 10 links
  - 500,000 USD attributed conversions
- User 3:
  - 110 days
  - 50,000 clicks
  - 32 links
  - 1,000,000 USD attributed conversions
- Transactions:
  - 2,000,000 USD total
  - no single transaction exceeds 10,000 USD
  - `payout` stays `NULL` in conversions

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
  - `LOCAL_TEST_EMAIL_1=test1@gmail.com`
  - `LOCAL_TEST_EMAIL_2=test2@gmail.com`
  - `LOCAL_TEST_EMAIL_3=test3@gmail.com`
  - `LOCAL_TEST_EMAIL_4=test4@gmail.com`
- Staging:
  - `STAGING_TEST_EMAIL_1=prastogi34@gmail.com`
  - `STAGING_TEST_EMAIL_2=prtk6592@gmail.com`
  - `STAGING_TEST_EMAIL_3=p.rastogi@outlook.com`
  - `STAGING_TEST_EMAIL_4=r.prateek@outlook.com`

## Generated outputs
- `partner-testbench.local.sql`
- `partner-testbench.staging.sql`

## Usage
No setup copy step is required.

The generator works automatically in this order:
1. `process.env`
2. `test/.env` if present
3. built-in defaults

That means the default local and staging email sets already work out of the box, and you only need overrides if you want different seed identities.

Automatic ensure behavior:
- Local startup (`npm run dev`) now runs local migrations and then automatically ensures the local test bench.
- Staging deploy (`npm run deploy:staging`) now runs staging migrations and then automatically ensures the staging test bench before deploy.
- The ensure step checks whether the expected seeded users and their bench data are already present in the correct order.
- If the bench is missing or drifted, it reapplies the generated SQL automatically.
- Seed SQL is targeted to the test-bench identities so email collisions are refreshed instead of failing on unique constraints.
- The generator is called internally by the ensure step, so there is no separate package script required for it.

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
- User 4:
  - 20 days
  - 720 clicks
  - 2 links
  - 79,000 USD attributed conversions across 7 attributed transactions
  - 2 geographies
  - pending balance about 7.50 USD
  - available balance about 86.00 USD
  - total earnings about 111.00 USD
  - 1 settlement history row
- Transactions:
  - 2,079,000 USD total
  - no single transaction exceeds 10,000 USD
  - `payout` stays `NULL` in conversions

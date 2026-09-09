# Dukkan

Ordering for small merchants in Beirut. Merchants list what they sell, customers order and pay
by card, and merchants draw their takings from a wallet.

We launch with 40 merchants next Monday.

## Running it

Requires Node 20 or newer and pnpm. No Docker, no external services — the database is a file.

```bash
pnpm install
cp .env.example .env
pnpm db:reset      # apply migrations to a fresh database
pnpm seed          # generate merchants, catalogues and order history
pnpm dev           # http://localhost:3000
```

`pnpm test` runs the suite. `pnpm build` produces a production build.

The seed is deterministic: every run produces the same database, with the same ids. It takes a
few seconds and writes about 17MB.

## Accounts

Every generated account uses the password `password123`.

| Account | Role |
|---|---|
| `owner1@beirut-electronics.example` | merchant admin, Beirut Electronics |
| `owner2@hamra-grocers.example` | merchant admin, Hamra Grocers |
| `customer1@example.com` | customer |

```bash
curl -s -X POST localhost:3000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"owner1@beirut-electronics.example","password":"password123"}'
```

## Layout

```
app/api/          route handlers
src/services/     business rules
src/repositories/ database access
src/lib/          auth, validation, money, card provider, email
prisma/           schema, migrations, seed
docs/             SPEC.md, API.md, and the decision record in docs/adr
tests/            unit and integration
```

`docs/SPEC.md` is the product specification. `docs/adr/` records why things are the way they
are. Start there.

## Configuration

`.env.example` covers everything. `PROVIDER_LATENCY_MS` and `PROVIDER_TIMEOUT_MS` control the
card provider's response time and how long we wait for it; both are useful when working on
payments.

The card provider and the mailer are local fakes. They append to `provider.log` and
`emails.log` in the project root instead of reaching the network.

---

Taking part in the SE² challenge at AWS Community Day? The rules, the brief and the submission
form are at **{{PORTAL_DOMAIN}}**. Everything you need is there; this repository is just the code.

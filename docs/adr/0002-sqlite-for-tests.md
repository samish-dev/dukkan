# ADR-0002: SQLite as the datastore

- Status: Accepted
- Date: 2026-08-05
- Deciders: Rami, Karim

## Context

We need a database for development, for the test suite, and for launch. We are one server with
40 merchants and no operations team. A managed Postgres instance is roughly half our monthly
infrastructure budget and adds a service we would have to watch.

## Decision

SQLite, through Prisma, everywhere: development, tests and production. One file on disk,
backed up by copying it.

Running the same engine in tests as in production is the whole reason this is attractive.
A test suite that passes against one engine and deploys onto another is a test suite that
tells you less than it appears to.

## Consequences

Setup is `pnpm install` and nothing else. No container, no connection string to manage, no
second thing to keep alive at three in the morning.

**SQLite serialises writes.** There is one writer at a time, and a second concurrent write
waits or fails busy. Two practical consequences for how we write code:

- Do not fan writes out with `Promise.all` and expect them to go faster. They will not. They
  will queue, and under load they will start returning busy errors instead. Where a set of
  writes belongs together, apply them in sequence, or put them in a transaction.
- Reads are not affected and may be concurrent.

We revisit this if we outgrow one server. The migration path is Prisma's, and the schema is
portable; nothing in the application should assume SQLite specifically.

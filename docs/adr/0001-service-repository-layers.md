# ADR-0001: Route handler, service, repository

- Status: Accepted
- Date: 2026-08-04
- Deciders: Rami, Nadine

## Context

We are three people shipping quickly. Our last project put database queries directly in the
HTTP handlers, and by month three we could not change a query without reading every endpoint
that might touch it, and we could not test any rule without standing up a web server.

## Decision

Three layers, and each one may only call the layer below it.

- **Route handler** — authenticates the caller, validates the request body, calls one service,
  returns the result. No business rules. No database access.
- **Service** — owns the rules. Throws domain errors. Knows nothing about HTTP.
- **Repository** — owns Prisma. One module per aggregate. Returns plain data.

A handler that reads more than about twenty lines is usually a rule that belongs in a service.

## Consequences

Handlers look thin, and that is the point: what a handler does should be obvious at a glance,
and the interesting code should be somewhere it can be tested without a request object.

Services are directly testable. Swapping the data layer means touching one directory.

The cost is indirection. A change that touches a rule and its query touches two files. We
accept that.

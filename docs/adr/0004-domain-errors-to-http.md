# ADR-0004: Domain errors map to HTTP in one place

- Status: Accepted
- Date: 2026-08-19
- Deciders: Nadine, Karim

## Context

Services throw when a rule is broken: the order is not yours, the wallet is short, the email
is taken. Every handler was deciding on its own what that should mean over HTTP, and we had
the same condition answering 400 in one endpoint and 409 in another.

The alternative is for services to return HTTP status codes. That drags transport concerns
into the layer that is supposed to be free of them, and makes the rules untestable without
asserting on numbers that have nothing to do with the rule.

## Decision

Services throw typed domain errors and never mention HTTP. One function, `toHttpResponse`,
owns the mapping from error class to status code. Every handler ends the same way:

```ts
} catch (error) {
  return toHttpResponse(error)
}
```

An error class with no entry in the table is a 500, and is logged. That is deliberate: an
unmapped error is a case we have not thought about, and it should be loud.

## Consequences

The status code for a condition is decided once and is greppable in a single table.

Adding a domain error means adding a row. Forgetting the row surfaces as a 500 in
development, which is the behaviour we want.

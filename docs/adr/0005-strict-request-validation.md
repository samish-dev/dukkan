# ADR-0005: Request bodies are strict

- Status: Accepted
- Date: 2026-08-27
- Deciders: Nadine

## Context

Zod strips unknown keys by default. A client that sends `{ quantiy: 2 }` gets a clean parse,
a missing field, and a confusing result. We lost an afternoon to exactly that: a field renamed
on the client, silently dropped by the server, and an order priced from a default.

The argument for permissive parsing is forward compatibility — an older server tolerating a
newer client's extra fields.

## Decision

Every request schema is `.strict()`. An unknown key is a 400 naming the offending field.

We do not have the forward compatibility problem. The client and the server ship together from
one repository. What we have is a correctness problem, and a request body is a trust boundary:
the moment to reject something we do not understand is before it reaches a rule, not after it
has quietly changed a total.

## Consequences

A client typo fails loudly, at the boundary, with the field name in the message.

Adding a field to a request means updating the schema in the same commit. That is a real cost
and it is the cost we want: the schema is the contract.

If we ever ship a client we do not control, this gets revisited per endpoint.

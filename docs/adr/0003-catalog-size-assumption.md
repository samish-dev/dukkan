# ADR-0003: Catalogue search without a search index

- Status: Accepted
- Date: 2026-08-06
- Deciders: Rami

## Context

Customers need to find a product inside a merchant's catalogue by name. The obvious options
are a dedicated search service, a database full-text index, or filtering the merchant's
products directly.

Our merchants are small shops. Walking the ones we have signed so far, a catalogue is a few
dozen items; the largest is a little over two hundred. **Merchant catalogues are expected to
stay under 500 products.**

## Decision

No search service and no search index. Catalogue search loads the merchant's products and
narrows them by name in the application.

At a few hundred rows this is immediate, and it is a dozen lines instead of an operational
dependency we would have to run and keep in sync.

## Consequences

One less service to operate before launch.

Search cost grows with the size of the merchant's catalogue rather than with the size of the
result. At the sizes above this is not worth engineering around.

If a merchant ever arrives with a catalogue far outside the range above, this needs revisiting
and the fix is to push the filter and the paging into the query.

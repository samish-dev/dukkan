# Changelog

## Unreleased

### Added
- Daily sales report endpoint for merchants.
- Early payout from the merchant wallet.
- Card payments with idempotency keys and a configurable client timeout.
- Order creation, pricing with VAT and promotional discounts, and the merchant order list.
- Product catalogue with per-merchant search.
- Email and password accounts with bearer tokens.

### Changed
- Domain errors now map to HTTP status codes in one place (ADR-0004).
- Request bodies reject unknown keys (ADR-0005).
- Seed generates a full quarter of order history instead of a handful of rows.

### Fixed
- Order list no longer returns other merchants' orders.
- Login no longer reports whether an email exists.
- Stock could go negative when two orders raced for the last item.

### Known issues
- Catalogue search slows noticeably on very large catalogues. Fine at our sizes, see ADR-0003.
- No refunds yet. Support issues them through the provider dashboard.

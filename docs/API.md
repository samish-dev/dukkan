# Dukkan — API Reference

All endpoints accept and return JSON. Authenticated endpoints take `Authorization: Bearer <token>`.
Money fields are integer US cents.

## Auth

### `POST /api/auth/register`
Body `{ email, password }`. Returns `{ id, email, role }`.

### `POST /api/auth/login`
Body `{ email, password }`. Returns `{ token, user }`. Tokens last 12 hours.

## Products

### `GET /api/products?page=&pageSize=`
Authenticated, merchant only. Lists the caller's own products, paginated.

### `POST /api/products`
Authenticated, merchant only. Body `{ name, description?, priceCents, stock? }`. Returns the product.

### `GET /api/products/:id`
Returns the product with its merchant, for the storefront header.

### `PUT /api/products/:id`
Authenticated. Body may contain `name`, `description`, `priceCents`, `stock`.

### `GET /api/catalog?merchantId=&q=&page=&pageSize=`
Public storefront search across one merchant's catalogue, by product name.
Returns `{ merchantId, q, page, pageSize, total, items }`.

## Merchants

### `GET /api/merchants/:id/products?page=&pageSize=`
Authenticated. Returns `{ merchant, items }` for the caller's own merchant, paginated.

## Orders

### `POST /api/orders`
Authenticated. Body `{ merchantId, items: [{ productId, quantity }], discountCents? }`.
Returns the created order with its lines. Unknown body keys are rejected.

### `GET /api/orders?page=&pageSize=`
Authenticated, merchant only. Paginated, newest first. Returns `{ page, pageSize, total, items }`.

### `GET /api/orders/:id`
Returns one order with its computed totals.

## Payments

### `POST /api/payments`
Authenticated. Requires an `Idempotency-Key` header. Body `{ orderId }`. Returns the payment.

### `POST /api/payments/:id/confirm`
Authenticated. Captures the payment, confirms the order, releases stock, emails the customer.

## Payouts

### `POST /api/payouts`
Authenticated, merchant only. Body `{ amountCents }`. Returns the payout.

### `GET /api/payouts`
Authenticated, merchant only. Lists the caller's payouts, newest first.

## Reports

### `GET /api/reports/daily?day=YYYY-MM-DD`
Authenticated, merchant only. Returns `{ merchantId, day, totalCents, orderCount, from, to }`.

## Errors

Domain failures return `{ error: string }` with a status from the central mapping:
400 validation, 401 unauthenticated, 403 forbidden, 404 not found, 409 conflict,
504 provider timeout. Anything unmapped is a 500.

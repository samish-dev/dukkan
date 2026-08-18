# Dukkan — Product Specification

Owner: product
Status: living document. Sections marked *Not settled* are still open with product.

---

## 1. What we are building

An ordering platform for small merchants in Beirut. Merchants list products; customers browse
a merchant's catalogue, place an order, and pay by card. Merchants hold a wallet, draw payouts
from it, and receive a sales report at the end of each day.

We go live with 40 merchants next Monday.

---

## 2. Conventions

- **Money is always an integer number of US cents.** No floats anywhere, in the database,
  in the API, or in the application. A price of $12.35 is `1235`.
- **VAT is 11%**, applied to the order subtotal.
- Timestamps are ISO 8601.
- Records are removed with a `deletedAt` marker rather than deleted outright. Anything a
  customer or merchant can see must exclude marked records.

---

## 3. Accounts

Two roles: `customer` and `merchant_admin`. A merchant admin owns exactly one merchant.

Registration takes an email address and a password. Email addresses identify an account.

*Not settled:* the self-service account closure flow. Support closes accounts by hand today.

---

## 4. Catalogue

A product has a name, a description, a price and a stock count, and belongs to one merchant.

A merchant may only read and write their own products. Attempting to read or write another
merchant's catalogue is an error, not an empty result.

Customers can search a merchant's catalogue by product name.

---

## 5. Orders

### 5.1 Placing an order

An order is placed against a single merchant and contains one or more lines. Each line
references a product belonging to that merchant and a quantity.

At checkout we:

1. Read the current price of each product.
2. Compute the subtotal as the sum of line price times quantity.
3. Apply VAT.
4. Apply any promotional discount, subject to the cap in 5.2.
5. Reduce the stock of each product by the quantity ordered.

Creating the order and reducing stock must either both happen or neither happen. An order that
exists against stock that was never reserved is a defect.

### 5.2 Discounts

A merchant may attach a promotional discount to an order.

> **The discount is capped at 30% of the pre-VAT subtotal.** A discount larger than the cap is
> reduced to the cap. The cap is calculated on the subtotal before VAT is added, not on the
> amount the customer finally pays.

### 5.3 Totals are fixed at checkout

> **An order's subtotal, VAT, discount and total are calculated once, at checkout, from the
> prices in effect at that moment, and stored on the order.** A later change to a product's
> price does not change any existing order. Reading an order back must return the stored
> figures.

This matters for reconciliation: a merchant who raises their prices on Tuesday must still see
Monday's orders at Monday's prices.

### 5.4 Reading orders

A customer may read their own orders. A merchant may read orders placed against their
merchant. Neither may read anyone else's.

The merchant order list is paginated, newest first. **Paging through the list must not repeat
a row or skip one.**

---

## 6. Payments

Payment is by card, through our provider.

The provider occasionally takes longer to answer than our client is willing to wait. Clients
therefore send an `Idempotency-Key` header with each payment attempt and retry on timeout.

> **A retry carrying an idempotency key we have already acted on must not result in a second
> charge.** One key means at most one charge against the customer's card.

Once a payment is captured, the order is confirmed and the customer is emailed a confirmation.
A confirmation must only be sent for an order that was actually confirmed.

---

## 7. Wallet and payouts

Sales credit a merchant's wallet. Payouts run weekly, and a merchant may also request an early
payout at any time.

> **A payout may never exceed the wallet balance.** The wallet balance may never go negative.

*Not settled:* payout fees, and whether early payouts should be rate limited.

---

## 8. Reporting

Merchants receive a sales report at the end of each day covering that day's orders: total
value and order count.

*Not settled:* weekly and monthly rollups, and whether the report should break down by product.

---

## 9. Out of scope for launch

Refunds, partial shipments, multi-merchant baskets, delivery tracking, and the merchant mobile
application.

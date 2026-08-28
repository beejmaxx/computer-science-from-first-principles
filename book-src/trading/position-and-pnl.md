# Position, P&L, and Exposure Tracking

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Market and Trading Systems</span></p>

Positions and profit-and-loss are derived state whose meaning depends on event ordering, price source, accounting convention, currency, and correction handling.

## Planned model

Apply fills, fees, cancels, busts, and price updates while displaying position, average cost, realized P&L, unrealized P&L, and gross exposure.

## Questions

- Which events are authoritative and idempotent?
- How are corrections represented without silently rewriting history?
- Which price and FX rate mark each exposure?

## Exercise

Specify an event-sourced position ledger that can be replayed and reconciled against an external statement.

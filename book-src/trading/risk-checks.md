# Pre-Trade Risk Checks and Kill Switches

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Market and Trading Systems</span></p>

Pre-trade risk constrains orders using current positions, outstanding exposure, limits, prices, and operational state before an order leaves the system.

## Planned model

Evaluate orders against quantity, notional, position, price-band, rate, and session limits. Show reservation, concurrent updates, rejection, release, and kill-switch action.

## Questions

- Which exposure must be reserved before acknowledgement?
- How do fills, rejects, and cancels release or convert reservations?
- Which failure defaults to reject rather than proceed?

## Exercise

Define atomic state transitions for two concurrent orders competing for the last available risk capacity.

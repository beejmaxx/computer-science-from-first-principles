# Order Gateways and State Machines

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Market and Trading Systems</span></p>

An order gateway reconciles local intent with asynchronous acknowledgements, rejects, fills, cancels, disconnects, and session recovery.

## Planned model

Drive an order through pending, live, partially filled, cancel-pending, terminal, and uncertain states while messages arrive late or duplicate.

## Questions

- Which transitions are legal from every state?
- How are client and venue identifiers correlated?
- What does the system know after a disconnect before reconciliation?

## Exercise

Construct an order-state machine that treats duplicates idempotently and never resurrects a terminal order.

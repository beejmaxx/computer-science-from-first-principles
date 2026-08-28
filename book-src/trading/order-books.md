# Limit Order Books and Price-Time Priority

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Market and Trading Systems</span></p>

A limit order book groups resting interest by price and orders each price level according to venue rules such as price-time priority.

## Planned model

Apply add, cancel, replace, and execute events. Animate best bid and offer, per-price FIFO queues, crossed books, and stale-handle rejection.

## Questions

- Which operations need lookup by order ID, price, or queue position?
- How are partial executions represented?
- What invariants detect a corrupt reconstruction?

## Exercise

Choose data structures for a bounded price domain and for a sparse price domain, explaining cancellation cost in each.

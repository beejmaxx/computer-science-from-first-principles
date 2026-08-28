# Prefix Aggregates and Incremental Computation

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Essential Algorithms</span></p>

Precomputed prefixes and incremental state exchange repeated work for stored summaries and carefully maintained invariants.

## Planned model

Compare rescanning a range with prefix sums, a difference array, and a rolling update. Show build cost, query cost, update cost, and invalidated state.

## Questions

- Which operations have inverses and can be removed from a running aggregate?
- When do Fenwick or segment trees become necessary?
- How can numerical error accumulate in floating-point running totals?

## Exercise

Design a rolling volume calculation that supports arrivals, expirations, and occasional corrections.

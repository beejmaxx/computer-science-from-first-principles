# Layout, Containers, and Invalidation

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> High-Performance C++</span></p>

Container choice determines locality, indirection, iterator stability, growth,
and the validity of stored pointers and references.

## Planned model

Compare contiguous, node-based, flat, and segmented containers under traversal,
insertion, erasure, and growth. Animate which handles become invalid.

## Questions

- What does the standard guarantee about layout and invalidation?
- When is stable identity worth pointer chasing?
- Which benchmark inputs expose capacity growth and cold-cache behavior?

## Exercise

Choose representations for an order table, a FIFO price level, and a read-mostly
lookup table. State the invalidation and locality contract for each.

# Cache Coherence and False Sharing

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Concurrency</span></p>

Coherence keeps cached copies of a memory location consistent. Because ownership moves at cache-line granularity, independent variables can still interfere.

## Planned model

Place counters on cache lines and alternate writes from several cores. Animate line ownership, invalidations, read sharing, and padding.

## Questions

- Why can per-thread counters contend without a lock?
- When does padding help, and what memory cost does it impose?
- How does read-mostly sharing differ from write sharing?

## Exercise

Diagnose a scaling collapse in a sharded counter and redesign its layout without changing its logical ownership.

# Transactions, Isolation, and Recovery

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Storage and Database Internals</span></p>

Transactions define which intermediate states may be observed and how committed state survives failure. Isolation and durability require distinct mechanisms.

## Planned model

Interleave reads and writes under locking and multiversion concurrency control. Inject crashes around log, data-page, commit, and checkpoint events.

## Questions

- Which anomalies does each isolation level permit?
- What ordering between WAL and data pages enables recovery?
- How are abandoned versions or locks cleaned up?

## Exercise

Construct one write-skew history and show which isolation rule prevents it.

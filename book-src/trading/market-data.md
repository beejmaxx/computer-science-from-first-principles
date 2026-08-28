# Market Data Feeds and Gap Recovery

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Market and Trading Systems</span></p>

Market-data consumers transform sequenced messages into local state while detecting loss, duplication, stale snapshots, and recovery boundaries.

## Planned model

Deliver snapshots and incrementals with duplicates, gaps, reordering, and channel failover. Show expected sequence, buffered messages, recovery, and book validity.

## Questions

- When is locally reconstructed state trustworthy?
- How do snapshot and incremental sequence domains join?
- What processing may continue while a gap is repaired?

## Exercise

Specify a deterministic state machine for startup, normal flow, gap detection, recovery, and reset.

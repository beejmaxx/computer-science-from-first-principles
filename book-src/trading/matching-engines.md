# Matching Engines and Deterministic Replay

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Market and Trading Systems</span></p>

A matching engine applies a totally ordered command stream to a deterministic state machine and emits executions, acknowledgements, and market-data effects.

## Planned model

Sequence commands through validation and matching while exposing price-time queues, emitted events, snapshots, replay, and failover divergence.

## Questions

- What establishes one authoritative command order?
- Which inputs besides commands can break determinism?
- How are output and durable state coordinated?

## Exercise

Define the minimum replay log needed to rebuild identical book state and outputs after a crash.

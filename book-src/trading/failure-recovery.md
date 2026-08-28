# Failure Recovery and Operational Controls

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Market and Trading Systems</span></p>

Recovery is a state-reconciliation problem: after a partial failure, the system must determine what happened externally before safely resuming action.

## Planned model

Inject process crashes, dropped acknowledgements, stale replicas, network partitions, and operator actions. Track durable intent, external state, uncertainty, and recovery decisions.

## Questions

- Which actions are idempotent and which may duplicate exposure?
- What state survives each failure boundary?
- When must automation stop and require explicit reconciliation?

## Exercise

Write a recovery runbook for a gateway crash with live orders and an incomplete local acknowledgement log.

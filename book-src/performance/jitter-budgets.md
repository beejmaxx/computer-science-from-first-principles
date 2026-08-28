# Jitter Budgets and Critical Paths

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Performance Engineering</span></p>

A latency budget assigns time to the dependent stages on a critical path and reserves room for variation, queueing, and failure handling.

## Planned model

Compose stage distributions into an end-to-end timeline. Add queueing, parallel branches, pauses, and correlated slow paths while tracking budget violations.

## Questions

- Which stages are sequential and which overlap?
- Where does waiting enter the critical path?
- Why do individual p99 values not simply add into an end-to-end p99?

## Exercise

Allocate a deadline across receive, parse, decide, validate, encode, and send stages, including explicit jitter reserve.

# Multi-Producer Algorithms and Contention

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Concurrency</span></p>

Adding producers changes ownership from exclusive cursor updates to coordinated claims, retries, and possible contention hotspots.

## Planned model

Let producers claim shared slots with a lock, fetch-add, or compare-exchange loop. Display failed retries, fairness, cache-line traffic, and consumer progress.

## Questions

- Where is the serialization point?
- Can work be sharded before coordinating globally?
- What progress guarantee does the algorithm actually provide?

## Exercise

Compare one MPSC queue with per-producer SPSC queues and define workloads that favor each design.

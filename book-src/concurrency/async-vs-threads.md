# Async Runtimes Versus Dedicated Threads

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Concurrency</span></p>

Async tasks multiplex waiting operations over executor threads; dedicated threads give execution contexts stronger placement and blocking assumptions.

## Planned model

Run the same I/O-heavy and CPU-heavy workloads through an async executor and dedicated workers. Show task queues, wake-ups, blocking, migration, and latency.

## Questions

- Is the work mostly waiting or computing?
- What happens when an async task blocks its executor thread?
- Which design gives the required affinity and scheduling control?

## Exercise

Partition a system between async coordination and dedicated critical-path threads, explaining every boundary.

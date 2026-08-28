# CPU Affinity, Pinning, and Isolation

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Operating Systems and Execution</span></p>

Affinity constrains where a thread may execute. Isolation coordinates the scheduler, interrupts, background work, and memory placement around a latency-sensitive CPU.

## Planned model

Move workers, interrupts, and kernel tasks across a topology map. Show migrations, cache warming, sibling contention, and NUMA locality.

## Questions

- What is gained and lost by pinning a thread?
- Why can simultaneous-multithreading siblings interfere?
- Which work still reaches an allegedly isolated CPU?

## Exercise

Assign receive, strategy, logging, and housekeeping threads to a two-socket machine and state the assumptions behind the layout.

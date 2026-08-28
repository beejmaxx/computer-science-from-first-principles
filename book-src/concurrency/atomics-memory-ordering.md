# Atomics and Memory Ordering

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Concurrency</span></p>

Atomicity prevents torn operations; memory ordering constrains what other reads and writes may appear before or after them.

## Planned model

Execute litmus tests under relaxed, acquire-release, and sequentially consistent ordering. Display per-thread operations, allowed observations, and synchronization edges.

## Questions

- What correctness property requires an atomic operation?
- Which write publishes the data and which read consumes it?
- Why is “the CPU reordered it” an incomplete explanation?

## Exercise

Prove the ordering of a one-time publication pattern and identify the weakest defensible ordering for each atomic access.

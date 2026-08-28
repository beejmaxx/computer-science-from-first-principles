# C++ Atomics and Memory Ordering

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> High-Performance C++</span></p>

An atomic operation prevents a data race only for the object and ordering it
actually governs. Correct lock-free code requires an explicit happens-before
argument and a safe lifetime strategy.

## Planned model

Build a single-producer/single-consumer ring from ordinary storage and atomic
indices. Animate publication, observation, acquire/release edges, wraparound,
and cache-line ownership.

## Questions

- What invariant assigns each slot to exactly one owner?
- Which write publishes the payload, and which read observes it?
- What changes when weak ordering, false sharing, or object reclamation enters?

## Exercise

Write the happens-before proof for one enqueue and dequeue before writing any
implementation code.

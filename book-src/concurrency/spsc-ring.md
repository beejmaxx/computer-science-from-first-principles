# Lock-Free SPSC Ring Buffers

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Concurrency</span></p>

A single-producer/single-consumer ring exploits exclusive ownership of the write and read positions. Lock-free does not mean synchronization-free.

## Planned model

Animate producer and consumer cursors, wraparound, full and empty states, data publication, cache-line placement, and acquire-release edges.

## Questions

- Which cursor may each thread modify?
- How is a written slot published before it is observed?
- How are full and empty distinguished safely?

## Exercise

State the invariants and memory orderings for a fixed-capacity SPSC queue before implementing any unsafe storage.

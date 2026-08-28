# Zero-Copy Techniques

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Networking and I/O</span></p>

“Zero copy” names several techniques that eliminate particular copies, not a universal guarantee that bytes never move or incur ownership costs.

## Planned model

Trace buffers through ordinary reads, scatter-gather I/O, memory mapping, page remapping, and registered buffers. Count copies, mappings, pins, and lifetime constraints.

## Questions

- Which specific source-to-destination copy is removed?
- What setup, pinning, alignment, or lifetime cost replaces it?
- When is copying a small message faster and simpler?

## Exercise

Audit a claimed zero-copy path and enumerate every point at which payload bytes or metadata still move.

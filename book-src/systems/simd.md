# SIMD and Vectorization

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> The Machine</span></p>

Single-instruction, multiple-data execution applies one operation across several lanes, provided data layout and control flow expose enough independent work.

## Planned model

Compare scalar and lane-based processing. Animate loads, masks, horizontal reductions, tail handling, and the effect of aligned contiguous data.

## Questions

- Which loops can the compiler auto-vectorize?
- How do branches become masks?
- When do gathering, shuffling, and horizontal reduction erase the gain?

## Exercise

Reshape a scalar filter-and-sum loop so its data dependencies and remainder handling are explicit.

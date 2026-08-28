# Sorting, Selection, and Top-K

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Essential Algorithms</span></p>

Ordering everything is often unnecessary. This chapter will compare full sorting, partial selection, and bounded top-k maintenance by the work and data movement each performs.

## Planned model

Animate the same stream through a sort, quickselect-style partition, heap, and fixed-size insertion buffer. Track comparisons, swaps, allocations, and cache-line touches.

## Questions

- When is `sort_unstable` preferable to preserving equal-item order?
- When does a heap beat sorting the whole input?
- How do nearly sorted, duplicated, or adversarial inputs change behavior?
- Which result is required: exact order, one rank, or an unordered top-k set?

## Exercise

Choose an algorithm for retaining the ten largest values from an unbounded stream and defend its memory bound and update cost.

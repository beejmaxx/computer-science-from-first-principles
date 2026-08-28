# Allocation, `pmr`, and Pools

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> High-Performance C++</span></p>

Allocation policy affects throughput, fragmentation, locality, determinism, and
which thread pays for reclamation. `std::pmr` separates many containers from the
resource that supplies their storage.

## Planned model

Run the same workload with the default allocator, a monotonic resource, a pool,
and a fixed arena. Show allocation count, reuse, peak memory, and reset cost.

## Questions

- Does the workload need individual frees or phase-based reset?
- Who owns the resource, and can any object outlive it?
- Does a pool improve the measured tail or merely move work elsewhere?

## Exercise

Design allocation lifetimes for decoded packets that are discarded after one
processing batch.

# Allocation — General Heaps, Pools, and Predictable Reuse

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> The Machine</span></p>

Dynamic allocation finds storage for values whose size or lifetime is decided
at runtime. The allocator's policy affects bookkeeping, reuse, fragmentation,
locality, synchronization, and the possibility of slow paths.

This chapter will compare three deliberately different lifetime models rather
than treating “allocation” as one operation.

## Planned interactive model

The simulator will offer the same sequence of requests to three allocators:

```text
general allocator    variable-size blocks; allocate and free individually
fixed-size pool      equal-size slots; reuse through a free list
bump arena           advance one pointer; release the region as a unit
```

Planned controls:

- Choose general allocator, object pool, or bump arena.
- Allocate small, medium, or large objects.
- Free an individual object when the model permits it.
- Reset the entire region.
- Run identical scripted workloads across all three models.

The visual state should expose:

- Occupied and free regions.
- Reused slots.
- Internal and external fragmentation.
- Bookkeeping operations.
- Capacity exhaustion.
- Individual cleanup versus bulk cleanup.

The simulator will be a conceptual model, not a claim about a particular Rust
global allocator or operating-system implementation.

## Questions the chapter should answer

- What does `Box`, `Vec`, or `String` actually request from an allocator?
- Why can allocation latency vary?
- When does freeing memory make it reusable without returning it to the OS?
- How do size classes and free lists reduce search cost?
- What is the difference between internal and external fragmentation?
- Why can pools improve predictability and locality?
- Why is a bump arena cheap, and what lifetime restriction buys that speed?
- When can thread-local allocation avoid shared contention?
- Which costs come from the allocator, virtual memory, first touch, or object
  initialization?
- When is preallocation simpler than replacing the allocator?

## Proposed structure

### 1. “Heap” has two meanings

Separate the process's dynamic-allocation region from the `BinaryHeap` data
structure. They share a historical word, not an implementation.

### 2. The allocation request

Introduce size, alignment, lifetime, initialization, and ownership as distinct
concerns. Show that reserving bytes and constructing a Rust value are related
but different operations.

### 3. General-purpose allocators

Explain variable-size requests, size classes, metadata, free lists, splitting,
coalescing, and why an implementation balances average throughput, memory use,
and concurrency rather than guaranteeing one fixed latency.

### 4. Fixed-size object pools

Model a collection of equal-size slots and a free list. Connect the design to
orders, messages, descriptors, tasks, and other bounded object populations.

Discuss exhaustion policy explicitly:

```text
reject | fall back | block | grow | shed work
```

### 5. Bump arenas

Allocate by advancing an offset. Explain why individual removal is normally
absent and why resetting or dropping the whole arena is cheap.

Connect the model to parsing, request-scoped scratch space, compilation phases,
and batch processing.

### 6. Fragmentation

Distinguish:

- Internal fragmentation: unused bytes inside an allocated block or size class.
- External fragmentation: free space exists but is divided into unsuitable
  regions.

Also separate virtual address-space fragmentation from committed physical
memory and allocator-visible blocks.

### 7. Locality and first touch

Tie allocation back to cache lines, pages, TLB entries, and NUMA placement.
Objects allocated near one another are not automatically used near one another;
lifetime grouping and access grouping may disagree.

### 8. Concurrency and allocator state

Describe shared locks, atomic metadata, per-thread caches, remote frees, and the
tradeoff between reducing contention and retaining more memory in local caches.

### 9. Rust ownership and destruction

Cover:

- Allocation versus initialization.
- Moving an owning handle versus moving the allocation.
- Drop order and bulk destruction.
- Pools that return handles instead of long-lived references.
- Why unsafe custom allocators require stronger invariants than a container.

### 10. Preallocation before specialization

Show the ordinary tools to try first:

- `Vec::with_capacity`
- Reusing buffers with `clear`
- Keeping scratch storage across iterations
- Bounded queues
- Slabs and generational arenas

The central rule should be:

> Remove allocation from a measured critical path by controlling capacity and
> lifetime before reaching for a custom allocator.

### 11. Measurement plan

The finished chapter should distinguish:

- Warm allocator throughput.
- Cold page and first-touch behavior.
- Single-threaded versus contended allocation.
- Typical latency versus tail latency.
- Allocation cost versus initialization and destruction.
- Memory retained, committed, and actively used.

## Candidate Rust examples

- Reuse a `Vec` buffer without discarding its capacity.
- Implement a small fixed-capacity pool with a free list.
- Implement a safe bump arena for byte slices with one bulk reset point.
- Compare handle-based removal with borrowed references.
- Make exhaustion an explicit `Result` rather than an accidental allocation.

## Planned exercise

Given a pipeline that holds at most 8,192 fixed-size messages, design a pool and
its exhaustion policy. State which operations must be constant-time, which
thread owns allocation and reclamation, how stale handles are prevented, and
what happens when the producer outruns the consumer.

## Open decisions

- Whether to introduce allocator APIs or remain at the container/pool level.
- Whether the main pool example should be single-threaded or SPSC-owned.
- Whether fragmentation deserves its own animation.
- Whether NUMA-aware allocation belongs here or in the later NUMA chapter.
- Which measurement tools belong here versus the performance-engineering
  section.

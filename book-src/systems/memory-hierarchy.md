# Memory Hierarchy — Where Data Becomes Time

<p class="chapter-subtitle">The cost of reading a value depends on where its cache line is, what arrived beside it, and whether the processor can find useful work while it waits.</p>

<p class="chapter-meta"><span><strong>Section</strong> The Machine</span><span><strong>Model</strong> Cache lines and locality</span><span><strong>Goal</strong> Predict data movement</span></p>

<div class="system-demo memory-lab" data-system-demo="memory-hierarchy">
  <div class="system-demo-controls" aria-label="Memory-access controls">
    <label class="system-demo-field">Access pattern
      <select data-memory-pattern>
        <option value="sequential">Sequential scan</option>
        <option value="strided">Stride of five</option>
        <option value="pointer-chase">Pointer chase</option>
        <option value="hot-loop">Repeat four hot records</option>
      </select>
    </label>
    <label class="system-demo-field">Storage
      <select data-memory-layout>
        <option value="packed">Packed array</option>
        <option value="nodes">Scattered nodes</option>
      </select>
    </label>
    <label class="system-demo-field">Working set
      <select data-memory-working-set>
        <option value="12">12 records</option>
        <option value="24" selected>24 records</option>
      </select>
    </label>
    <label class="system-demo-field">Cache capacity
      <select data-memory-capacity>
        <option value="3" selected>3 lines</option>
        <option value="6">6 lines</option>
      </select>
    </label>
    <button type="button" data-memory-action="step">Next access</button>
    <button type="button" data-memory-action="run" aria-pressed="false">Run</button>
    <button type="button" data-memory-action="reset">Reset</button>
  </div>
  <div class="system-demo-metrics" aria-live="polite">
    <span class="system-demo-metric"><strong data-memory-accesses>0</strong>accesses</span>
    <span class="system-demo-metric"><strong data-memory-hits>0</strong>hits</span>
    <span class="system-demo-metric"><strong data-memory-misses>0</strong>misses</span>
    <span class="system-demo-metric"><strong data-memory-hit-rate>—</strong>hit rate</span>
    <span class="system-demo-metric"><strong data-memory-utilization>—</strong>fetched-line use</span>
  </div>
  <div class="memory-lab-layout">
    <section class="memory-lab-panel">
      <div class="memory-lab-heading"><strong>Conceptual memory</strong><span data-memory-map>four records per 64-byte line</span></div>
      <div class="memory-lines" data-memory-lines role="img" aria-label="Conceptual memory lines"></div>
    </section>
    <section class="memory-lab-panel cache-panel">
      <div class="memory-lab-heading"><strong>Simplified cache</strong><span>LRU → MRU</span></div>
      <div class="cache-contents" data-cache-contents></div>
      <div class="memory-lab-transfer" data-memory-transfer>No line transferred yet.</div>
    </section>
  </div>
  <div class="system-demo-history" data-memory-history>recent accesses: —</div>
  <p class="system-demo-status" data-memory-status aria-live="polite"></p>
  <noscript>The interactive controls require JavaScript.</noscript>
</div>

Start with a packed sequential scan and press **Run**. Then change only storage
to **Scattered nodes**. Both experiments visit the same logical records and do
the same `O(n)` work; their physical line traffic is very different.

The lab uses 16-byte useful records and 64-byte cache lines. A packed line holds
four adjacent records. A scattered node occupies a different conceptual line,
leaving the other 48 bytes unused. Real allocators and nodes have more varied
layouts, but this contrast isolates spatial locality.

## A latency ladder

The hierarchy exists because no single storage technology is simultaneously the
smallest, fastest, cheapest, and largest. Capacity increases as we move away from
the execution units; latency usually increases with it.

<div class="latency-ladder" role="img" aria-label="Illustrative logarithmic latency ladder from registers through persistent storage">
  <div class="latency-ladder__header"><strong>Illustrative access latency</strong><span>logarithmic visual scale · not a hardware specification</span></div>
  <div class="latency-rung" style="--latency-width: 6%"><span class="latency-rung__name">Registers</span><span class="latency-rung__bar"></span><span class="latency-rung__value">operand/instruction dependent</span></div>
  <div class="latency-rung" style="--latency-width: 12%"><span class="latency-rung__name">L1 data cache</span><span class="latency-rung__bar"></span><span class="latency-rung__value">roughly 3–5 cycles</span></div>
  <div class="latency-rung" style="--latency-width: 24%"><span class="latency-rung__name">L2 cache</span><span class="latency-rung__bar"></span><span class="latency-rung__value">roughly 10–20 cycles</span></div>
  <div class="latency-rung" style="--latency-width: 40%"><span class="latency-rung__name">Last-level cache</span><span class="latency-rung__bar"></span><span class="latency-rung__value">roughly 30–80 cycles</span></div>
  <div class="latency-rung" style="--latency-width: 62%"><span class="latency-rung__name">Local DRAM</span><span class="latency-rung__bar"></span><span class="latency-rung__value">often tens to 150+ ns</span></div>
  <div class="latency-rung" style="--latency-width: 72%"><span class="latency-rung__name">Remote NUMA DRAM</span><span class="latency-rung__bar"></span><span class="latency-rung__value">often slower and topology-sensitive</span></div>
  <div class="latency-rung" style="--latency-width: 100%"><span class="latency-rung__name">Persistent storage</span><span class="latency-rung__bar"></span><span class="latency-rung__value">typically microseconds or more</span></div>
</div>

These are intentionally broad orientation ranges. A reported cache latency must
name the processor and clarify whether it is load-to-use latency, sustained
throughput, dependent access, or an overlapped stream. DRAM depends on memory
frequency, controllers, queueing, row state, and NUMA placement. Persistent
storage is included to show scale; it is not a CPU cache level.

At 3 GHz, one cycle is about one third of a nanosecond. A 4-cycle L1 hit and a
90-nanosecond DRAM access therefore differ by roughly two orders of magnitude.
The processor may overlap independent misses, so latency is not the same as
achievable bandwidth.

### What the levels mean

| Level | Basic role | Typical scope | Capacity intuition |
| --- | --- | --- | --- |
| Registers | Operands used directly by instructions | One hardware thread or core execution context | A very small named and renamed working set |
| L1 instruction/data caches | Keep the nearest instructions and data lines ready | Commonly private to one core | Tens of KiB per cache |
| L2 cache | Catch a larger working set after an L1 miss | Often private to one core | Hundreds of KiB to several MiB |
| Last-level cache | Reduce trips to DRAM and mediate traffic among cores | Often shared or physically distributed in slices | Several to many MiB |
| DRAM | Main volatile program memory | Attached to a socket or NUMA node | GiB to TiB |
| Persistent storage | Durable files, logs, and databases | Device and operating-system I/O path | Hundreds of GiB to TiB |

“L3” and “last-level cache” are often the same level on a server CPU, but not
universally. Cache topology, private/shared boundaries, and inclusivity vary.
Query the target machine and consult its processor documentation instead of
building software around this representative table.

CPU caches are generally built from fast on-chip SRAM-like structures. Main
memory uses denser DRAM located beyond the core and usually beyond the CPU die.
An SSD is storage, not slower DRAM: ordinary CPU loads do not directly fetch its
bytes into registers. Data travels through an I/O and operating-system path before
the processor can consume it as memory.

## When this matters

Memory locality matters whenever a hot loop performs little arithmetic compared
with the data it touches. Common examples include:

- Feed handlers parsing large buffers.
- Order books, indexes, graphs, and lookup tables.
- Queues and progress counters shared between cores.
- Batch calculations over many records.
- Any latency-sensitive path whose working set does not remain in the nearest cache.

The first question should not be “which clever instruction should I use?” It is:

> Which cache lines must move for this operation, and how much useful work does
> each transferred line enable?

## 1. Memory is a hierarchy

A core can access several storage levels. Names and topology vary by processor,
but the durable relationship is:

~~~text
registers
    ↓
small per-core caches
    ↓
larger private or shared caches
    ↓
main memory
~~~

Levels nearer the core are smaller and generally faster. When a required line is
absent, hardware obtains it from a farther level. Independent instructions may
overlap some of that delay; a dependent instruction must wait for its input.

That is why “one array access” is not a stable unit of time.

## 2. The transfer unit is a line

Processors normally move aligned blocks called **cache lines** between cache
levels. A 64-byte line is common on contemporary general-purpose processors, but
it is not a universal language-level guarantee.

Requesting one 8-byte field can fetch the surrounding line. This produces two
possible outcomes:

- Nearby values are used soon, amortizing the transfer.
- The program jumps elsewhere and most transferred bytes are wasted.

The lab's **fetched-line use** metric counts how many distinct 16-byte records are
used from each line load. Re-reading the same hot record can produce cache hits,
but it does not retroactively make unused neighboring bytes useful. Hit rate and
line utilization describe different properties.

## 3. Spatial and temporal locality

**Spatial locality** means accessing nearby addresses. A packed sequential scan
misses on the first record of a line, then can hit on the next three.

**Temporal locality** means reusing the same data soon. Select **Repeat four hot
records**. If the cache can retain the required lines, later passes hit even when
the broader data set is large.

These properties can work independently:

| Pattern | Spatial locality | Temporal locality |
| --- | --- | --- |
| One packed sequential pass | Strong | Little reuse |
| Repeated small hot set | Depends on layout | Strong |
| Scattered pointer chase | Usually weak | Depends on repetition |
| Large strided scan | Often weak | Usually weak within one pass |

## 4. Logical order is not physical layout

A language-level sequence describes logical order. Hardware observes addresses.

~~~text
packed array:
line 0: [record 0][record 1][record 2][record 3]
line 1: [record 4][record 5][record 6][record 7]

scattered nodes:
line 0: [record 7][unused........................]
line 1: [record 2][unused........................]
line 2: [record 11][unused.......................]
~~~

Walking logical records `0, 1, 2, 3` can therefore touch one line or four unrelated
lines. The algorithm has not changed; its representation has.

## 5. Working-set size determines whether reuse survives

A **working set** is the data needed over a relevant interval. Temporal locality
helps only while the reused lines remain close enough to the core.

The lab uses a tiny fully associative cache with least-recently-used replacement:

1. A hit moves the line to the most-recently-used end.
2. A miss inserts the new line.
3. If capacity is full, the least-recently-used line is evicted.

Real caches are divided into sets and ways, so addresses can conflict even when
the total number of lines appears to fit. The simplified model demonstrates
capacity pressure without pretending to model a specific CPU.

Three broad causes are useful when reasoning about misses:

- **Compulsory:** the line has not been loaded yet.
- **Capacity:** the active data exceeds available cache space.
- **Conflict:** limited placement choices evict lines that could fit in a fully
  associative cache of the same size.

## 6. Pointer chasing adds a dependency chain

A pointer-linked traversal conceptually performs:

~~~text
load node
    → discover address of next node
        → load next node
~~~

The processor cannot know the next address until the current node arrives. A
sequential array exposes future addresses immediately, allowing hardware
prefetchers and out-of-order execution to look ahead.

The lab changes access order when **Pointer chase** is selected, but it cannot
model elapsed cycles or memory-level parallelism. Its miss count shows only one
part of the disadvantage; the dependency chain can make the same misses harder
to overlap.

## 7. Same big-O, different traversal

These functions both visit every matrix element and perform `O(rows × columns)`
work. The matrix is stored in row-major order:

~~~rust
fn row_major_sum(values: &[u64], rows: usize, columns: usize) -> u64 {
    let mut total = 0;
    for row in 0..rows {
        for column in 0..columns {
            total += values[row * columns + column];
        }
    }
    total
}

fn column_major_sum(values: &[u64], rows: usize, columns: usize) -> u64 {
    let mut total = 0;
    for column in 0..columns {
        for row in 0..rows {
            total += values[row * columns + column];
        }
    }
    total
}
~~~

The first consumes adjacent values. The second jumps by an entire row. Their
asymptotic complexity is identical; line traffic, prefetch behavior, and observed
latency can differ substantially.

Do not infer a universal speed ratio. Matrix dimensions, cache geometry, compiler
optimization, prefetching, and surrounding work all affect the result.

## 8. Representation is a performance decision

Contiguous storage usually offers:

- Fewer allocations and less metadata.
- Predictable addresses.
- More useful values per transferred line.
- Easier batching, prefetching, and vectorization.

Node-, handle-, and pointer-based structures still earn their place when stable
identity, structural mutation, or another required operation outweighs traversal
cost. “Arrays are faster” is not a complete design argument. State the workload,
invariants, mutation costs, and evidence.

This also explains why a `VecDeque` frequently traverses faster than a linked
list, why an arena can improve both stable identity and locality, and why order
book implementations often separate stable handles from densely stored fields.

## 9. What the lab deliberately omits

Real memory behavior also depends on:

- Several cache levels and inclusive or exclusive policies.
- Set associativity and address-to-set mapping.
- Hardware and software prefetching.
- Translation lookaside buffers and page walks.
- Store buffers, write allocation, and coherence.
- Memory-level parallelism and outstanding misses.
- NUMA placement and remote memory.
- Other threads, interrupts, migrations, and power state.
- Compiler reordering, vectorization, and dead-code elimination.

Later chapters isolate those mechanisms. A useful model is small enough to
predict and explicit about what it cannot conclude.

## 10. How to measure this on real hardware

A defensible experiment should:

1. Generate identical useful results for each layout.
2. Prevent the optimizer from deleting the work.
3. Sweep working-set size across expected cache boundaries.
4. Separate cold-start behavior from steady state.
5. Record traversal order, element size, alignment, and allocation method.
6. Inspect elapsed time together with relevant hardware counters.
7. Repeat under realistic contention and CPU placement.

Counter names and interpretations are processor-specific. Begin with the vendor's
current optimization and performance-monitoring documentation, then confirm what
your profiler actually programs.

## 11. What you should internalize

1. A load is cheap or expensive depending on where its line currently resides.
2. Hardware transfers lines, not isolated language-level fields.
3. Spatial locality reuses neighboring bytes from one transfer.
4. Temporal locality helps only while the working set remains resident.
5. Logical order does not determine physical layout.
6. Pointer chasing can combine poor locality with serialized address discovery.
7. Equal big-O complexity does not imply equal data movement or latency.
8. Hit rate and fetched-line utilization answer different questions.
9. Compact predictable representations are strong defaults, not universal laws.
10. Hardware counters and controlled experiments decide whether the model explains
    the real workload.

## Retrieval drill

Assume 64-byte lines, 16-byte packed records, and an initially empty cache:

1. How many compulsory line misses occur while scanning records `0..12`?
2. After reading record `4`, which other records arrived in the same line?
3. Why can four scattered nodes require four transfers even if their payloads total
   only 64 bytes?
4. With a three-line cache, what happens while repeatedly accessing four lines in
   strict rotation?
5. Why can a pointer chase be slower than an array scan even when both report the
   same number of last-level cache misses?

## Sources

- Denis Bakhvalov et al., [*Performance Analysis and Tuning on Modern CPUs*](https://github.com/dendibakh/perf-book)
- [Intel 64 and IA-32 Architectures Optimization Reference Manual](https://www.intel.com/content/www/us/en/developer/articles/technical/intel64-and-ia32-architectures-optimization.html)
- [AMD performance-tuning documentation](https://docs.amd.com/r/en-US/63859-AOCL-performance-tuning-guide/Introduction)

Vendor manuals describe particular processors. The chapter's claims remain
conceptual unless an experiment names the target CPU, counters, software, and
configuration.

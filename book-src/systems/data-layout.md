# Data Layout — Which Bytes Move Together?

<p class="chapter-subtitle">The same logical records can place hot fields together, scatter them across columns, or carry cold bytes through every cache line.</p>

<p class="chapter-meta"><span><strong>Section</strong> The Machine</span><span><strong>Model</strong> AoS, SoA, and hot/cold splitting</span><span><strong>Goal</strong> Match representation to access</span></p>

<div class="system-demo layout-lab" data-system-demo="data-layout">
  <div class="system-demo-controls" aria-label="Data-layout controls">
    <label class="system-demo-field">Layout
      <select data-layout-kind>
        <option value="aos">Array of structures</option>
        <option value="soa">Structure of arrays</option>
        <option value="hot-cold">Hot/cold split</option>
      </select>
    </label>
    <label class="system-demo-field">Workload
      <select data-layout-workload>
        <option value="price">Price-only scan</option>
        <option value="matching">Matching path</option>
        <option value="full">Full-record processing</option>
      </select>
    </label>
    <label class="system-demo-field">AoS stride
      <select data-layout-stride>
        <option value="natural">56 B packed</option>
        <option value="aligned">64 B aligned</option>
      </select>
    </label>
    <button type="button" data-layout-action="step">Process next record</button>
    <button type="button" data-layout-action="run" aria-pressed="false">Run</button>
    <button type="button" data-layout-action="reset">Reset</button>
  </div>
  <div class="system-demo-metrics" aria-live="polite">
    <span class="system-demo-metric"><strong data-layout-records>0</strong>records</span>
    <span class="system-demo-metric"><strong data-layout-lines>0</strong>lines fetched</span>
    <span class="system-demo-metric"><strong data-layout-useful>0 B</strong>useful bytes</span>
    <span class="system-demo-metric"><strong data-layout-waste>0 B</strong>unused bytes</span>
    <span class="system-demo-metric"><strong data-layout-efficiency>—</strong>line utilization</span>
  </div>
  <div class="layout-lab-heading"><strong>Physical byte order</strong><span data-layout-description>complete records are adjacent</span></div>
  <div class="layout-memory-lines" data-layout-memory role="img" aria-label="Conceptual record layout"></div>
  <p class="layout-legend"><code>P</code> price · <code>Q</code> quantity · <code>T</code> timestamp · <code>I</code> order ID · <code>M</code> metadata · each cell 8 B</p>
  <div class="layout-progress" data-layout-progress>next: record 0</div>
  <p class="system-demo-status" data-layout-status aria-live="polite"></p>
  <noscript>The interactive controls require JavaScript.</noscript>
</div>

Run a **Price-only scan** with each layout. Then select **Matching path**, which
reads price, quantity, and order ID. The useful computation is unchanged; only
the physical grouping of bytes changes.

The model contains eight logical orders. Each order has 56 useful bytes:

~~~text
price 8 | quantity 8 | timestamp 8 | order ID 8 | metadata 24
~~~

The AoS layout can use a 56-byte packed stride or an explicitly 64-byte-aligned
stride with 8 bytes of tail padding. The SoA layout groups equal fields. The
hot/cold layout keeps four 8-byte hot fields together and moves the 24-byte
metadata into a separate region.

## When layout becomes a design decision

Layout deserves attention when:

- Hot loops process large batches.
- Most operations read only a subset of each record.
- The working set competes for cache capacity or memory bandwidth.
- SIMD-friendly homogeneous inputs matter.
- Cold metadata inflates critical-path records.
- Separate threads write different fields and may false-share lines.
- Profiling attributes meaningful time to loads, misses, or stalled execution.

A specialized layout adds API and mutation invariants. It should earn that cost
through a known access pattern and measurement.

## 1. Array of structures keeps records together

An **array of structures** stores one complete record after another:

~~~text
[P0 Q0 T0 I0 M0...] [P1 Q1 T1 I1 M1...] ...
~~~

The direct Rust representation is a `Vec<Order>`:

~~~rust
#[derive(Clone)]
struct Order {
    price: u64,
    quantity: u64,
    timestamp: u64,
    id: u64,
    metadata: [u64; 3],
}

fn matching_checksum(orders: &[Order]) -> u64 {
    orders
        .iter()
        .map(|order| order.price ^ order.quantity ^ order.id)
        .sum()
}
~~~

AoS is natural when an operation consumes or transfers one complete record. The
type system keeps the fields together, and insertion or removal changes one
collection.

A narrow scan may fetch mostly irrelevant bytes. With a 64-byte-aligned record,
reading an 8-byte price uses one eighth of every transferred line.

## 2. Structure of arrays keeps fields together

A **structure of arrays** stores each field in a separate contiguous sequence:

~~~text
[P0 P1 P2 P3 ...]
[Q0 Q1 Q2 Q3 ...]
[T0 T1 T2 T3 ...]
[I0 I1 I2 I3 ...]
[M0 M1 M2 M3 ...]
~~~

~~~rust
struct OrderColumns {
    prices: Vec<u64>,
    quantities: Vec<u64>,
    timestamps: Vec<u64>,
    ids: Vec<u64>,
    metadata_0: Vec<u64>,
    metadata_1: Vec<u64>,
    metadata_2: Vec<u64>,
}

impl OrderColumns {
    fn len(&self) -> usize {
        self.prices.len()
    }

    fn invariant_holds(&self) -> bool {
        let len = self.len();
        self.quantities.len() == len
            && self.timestamps.len() == len
            && self.ids.len() == len
            && self.metadata_0.len() == len
            && self.metadata_1.len() == len
            && self.metadata_2.len() == len
    }
}
~~~

A price scan now transfers dense prices without order IDs or metadata. Separate
homogeneous arrays can also give a compiler straightforward vector inputs.

The representation introduces a central invariant:

~~~text
prices.len == quantities.len == timestamps.len == ids.len
           == metadata_0.len == metadata_1.len == metadata_2.len
~~~

Insertion, removal, permutation, error handling, and recovery must preserve row
identity across every column. Hiding the columns behind an API is part of making
the representation correct.

## 3. Hot/cold splitting is often the practical middle

Many systems are neither purely record-oriented nor purely analytical. A hybrid
keeps critical fields compact and resolves cold information only when needed:

~~~text
hot orders:  [P Q T I] [P Q T I] [P Q T I] ...
cold table:  [metadata] [metadata] [metadata] ...
~~~

The lab's hot record is 32 bytes, so two fit in a 64-byte line. The matching-path
scan uses three quarters of the hot bytes it fetches while avoiding metadata.

The costs are another lookup and an identity/lifetime relationship between the
two regions. Stable handles or dense indices can connect them; ordinary borrowed
references cannot outlive a relocation of either backing collection.

## 4. Alignment and padding are different ideas

**Alignment** restricts the addresses at which a value may begin. **Padding** is
unused space inserted between fields or at the end of a value so alignment and
stride constraints are satisfied.

Consider a stable C-compatible layout:

~~~rust
#[repr(C)]
struct Message {
    kind: u8,
    sequence: u64,
    side: u8,
}
~~~

The `u64` normally requires stronger alignment than `u8`, so padding can appear
before `sequence` and after `side`. Reordering fields may reduce size, but it can
also change ABI and wire compatibility.

Explicit cache-line alignment is a much stronger choice:

~~~rust
#[repr(C, align(64))]
struct AlignedCounter {
    value: std::sync::atomic::AtomicU64,
}
~~~

The alignment can isolate independently written counters, but it also expands
their stride and working set. Alignment is not free speed; it trades density for
placement guarantees.

In C++, the corresponding tools include `alignas`, `sizeof`, and `alignof`.
Always inspect the compiled target rather than inferring byte offsets from how the
declaration looks.

## 5. Field order changes holes and line crossings

For a representation with a specified field order, placing strongly aligned
fields first can reduce internal holes:

~~~text
less compact:  u8 | padding | u64 | u8 | tail padding
more compact:  u64 | u8 | u8 | tail padding
~~~

Minimum total size is not always the objective. You might deliberately:

- Keep fields read together on the same line.
- Separate fields written by different threads.
- Align the beginning of a batch for vector loads.
- Pad a ring entry to a fixed protocol or device descriptor size.
- Move rarely inspected diagnostic state out of the hot record.

The best field order follows access and ownership, not aesthetic sorting.

## 6. Cache-line boundaries are shared-resource boundaries

Two objects can be logically independent while occupying one physical line. If
different cores repeatedly write them, coherence operates on the entire line.
That is **false sharing**: no source-level variable is shared, but the cache line
is.

Padding can separate writers, yet padding every object may make reads worse by
reducing density. The later [Coherence and False Sharing](../concurrency/cache-coherence.md)
chapter will model ownership transfer between cores.

## 7. Layout and vectorization

SIMD instructions apply one operation to several lanes. Dense homogeneous values
are convenient inputs:

~~~text
prices: [100, 101, 102, 103, 104, 105, 106, 107]
~~~

Interleaved AoS fields may need shuffles or gathers before the arithmetic. Modern
processors support increasingly capable gather operations, but “vectorizable”
does not automatically mean “faster”: setup, masks, tails, code size, and memory
traffic still matter.

Inspect optimized output and measure the representative batch. The [SIMD](simd.md)
chapter develops this separately.

## 8. Mutation can reverse the apparent winner

A scan benchmark can make SoA look universally superior while ignoring updates:

- Inserting one logical row modifies every column.
- Removing by swap changes row identity unless indices are repaired.
- Stable external handles need an indirection or generation scheme.
- Exception or allocation failure can leave partially updated columns in C++ if
  the operation is not transactional.
- Concurrent readers need a publication rule covering every related column.

AoS often makes row-level mutation simpler. Hot/cold splitting can keep the hot
index stable while cold data follows a separate lifecycle. Representation must be
evaluated over its complete workload, not one attractive scan.

## 9. In-memory layout is not a wire or storage format

Rust's default representation does not promise stable field order for foreign
interfaces or persistence. `#[repr(C)]` supplies C-compatible layout rules, but
padding still exists and endianness is not solved. C++ object layout likewise
does not turn an arbitrary object into a portable packet.

Do not serialize structs by dumping their memory unless the format explicitly
defines every byte and the implementation safely enforces that contract. Network
messages and durable data require explicit field widths, byte order, versioning,
and validation.

## 10. How to choose with evidence

Benchmark at least the following dimensions:

1. The real ratio of narrow scans, matching-path reads, full reads, and mutations.
2. Working sets below and above expected cache capacities.
3. Cold-start and steady-state behavior.
4. Useful bytes versus transferred bytes.
5. Scalar and vectorized implementations.
6. Allocation and compaction costs.
7. Single-threaded access and realistic cross-core ownership.
8. Tail latency under the target load, not only maximum scan throughput.

Use compiler layout reports, `size_of`/`align_of`, optimized assembly, and hardware
counters to test the model. Do not infer a processor's cache traffic solely from
the source type.

## 11. What you should internalize

1. Logical records do not dictate one physical layout.
2. AoS keeps records together; SoA keeps fields together.
3. Hot/cold splitting is a useful third design, not a compromise to ignore.
4. Alignment restricts placement; padding consumes bytes to satisfy placement or
   stride decisions.
5. Smaller types do not guarantee a smaller struct when holes dominate.
6. Field-only scans can waste most bytes in an AoS line.
7. SoA introduces cross-column identity and mutation invariants.
8. Cache lines define coherence traffic as well as transfer size.
9. In-memory, wire, and persistent layouts are separate contracts.
10. The winning layout is the one that serves the complete measured workload.

## Retrieval drill

Using the lab's eight-record model:

1. Why does a price-only SoA scan need one line?
2. Why can 64-byte AoS alignment reduce price-scan utilization to 12.5%?
3. Which bytes move during the matching workload under the hot/cold layout?
4. What invariant must a SoA removal preserve?
5. When could adding padding lower cross-core latency while raising scan latency?

## Sources

- [Rust Reference: type layout](https://doc.rust-lang.org/reference/type-layout.html)
- Denis Bakhvalov et al., [*Performance Analysis and Tuning on Modern CPUs*](https://github.com/dendibakh/perf-book)
- [Intel 64 and IA-32 Architectures Optimization Reference Manual](https://www.intel.com/content/www/us/en/developer/articles/technical/intel64-and-ia32-architectures-optimization.html)

The examples establish reasoning tools, not a universal ABI or cache geometry.
Confirm sizes, offsets, alignments, generated code, and counters for the exact
compiler and processor used in an experiment.

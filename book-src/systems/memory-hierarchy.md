# Memory Hierarchy — Cache Lines and Locality

The time required to read a value depends on where that value is and whether
nearby data has already been brought close to the CPU. Memory is not one
uniformly fast array.

<div class="system-demo" data-system-demo="memory-hierarchy">
  <div class="system-demo-controls" aria-label="Memory-access controls">
    <label class="system-demo-field">Access pattern
      <select data-memory-pattern>
        <option value="sequential">Sequential</option>
        <option value="strided">Stride of five</option>
        <option value="pointer-chase">Pointer chase</option>
      </select>
    </label>
    <button type="button" data-memory-action="step">Next access</button>
    <button type="button" data-memory-action="run">Run pattern</button>
    <button type="button" data-memory-action="reset">Reset</button>
  </div>
  <div class="system-demo-metrics" aria-live="polite">
    <span class="system-demo-metric"><strong data-memory-accesses>0</strong>accesses</span>
    <span class="system-demo-metric"><strong data-memory-hits>0</strong>hits</span>
    <span class="system-demo-metric"><strong data-memory-misses>0</strong>misses</span>
  </div>
  <div class="memory-lines" data-memory-lines role="img" aria-label="Conceptual memory lines"></div>
  <div class="cache-panel">
    Simplified three-line cache, least-recently-used first
    <div class="cache-contents" data-cache-contents></div>
  </div>
  <div class="system-demo-history" data-memory-history>recent records: —</div>
  <p class="system-demo-status" data-memory-status aria-live="polite"></p>
  <noscript>The interactive controls require JavaScript.</noscript>
</div>

The simulator is deliberately small: each 64-byte line contains four
conceptual 16-byte records, and the cache holds three lines. Real processors
have several cache levels, set-associative placement, prefetchers, and many
other details. This model isolates the first principle: one miss transfers a
line, not only the requested field.

## When this matters

Memory locality matters when a workload repeatedly touches enough data that it
cannot all remain in the fastest cache, especially in:

- Parsers and feed handlers walking large buffers.
- Order books, indexes, graphs, and lookup tables.
- Queues shared between cores.
- Batch calculations over many records.
- Any latency-sensitive loop whose arithmetic is small compared with its data
  access.

Do not begin by guessing which cache dominates a program. Choose a compact,
predictable representation, measure representative data, and use profiling to
identify the actual misses and stalls.

## 1. Memory is a hierarchy

A core can access several storage levels. The names and exact organization vary
by processor, but the general relationship is durable:

```text
registers
    ↓
small per-core caches
    ↓
larger shared or private caches
    ↓
main memory
```

Levels nearer the core are smaller and generally faster. When a needed line is
absent from one level, hardware must obtain it from a farther level. The core
may overlap some of that delay with other independent work, but dependent work
must wait.

This is why “one array access” is not a stable unit of time.

## 2. The cache line is the transfer unit

Processors normally move aligned blocks called **cache lines** between cache
levels. A 64-byte line is common on contemporary general-purpose CPUs, but code
should not treat that size as universal unless the target platform guarantees
it.

If a program requests one 8-byte value, the machine may fetch the surrounding
line as well. That creates an opportunity:

> Work on neighboring values while their line is already close to the core.

It can also create waste: a pointer chase might consume one small field from a
line and then jump somewhere unrelated.

## 3. Spatial and temporal locality

**Spatial locality** means accessing addresses near one another. Sequential
array traversal has strong spatial locality because one fetched line supplies
several upcoming elements.

**Temporal locality** means reusing the same data soon. A small lookup table or
hot counter can remain cached across many operations.

The useful question is not simply “did I access this value?” It is:

```text
Which line did the access bring in?
How much of that line did useful work consume?
Will the line still be present when it is reused?
```

## 4. Three access patterns

### Sequential traversal

```text
0 → 1 → 2 → 3 → 4 → 5 → ...
```

After the first miss for a line, neighboring records are likely to hit. The
pattern is predictable, which can also help hardware prefetchers.

### Strided traversal

```text
0 → 5 → 10 → 15 → 20 → ...
```

A stride can touch many lines before returning to unused neighbors. Whether
that hurts depends on record size, stride, cache capacity, associativity, and
prefetch behavior.

### Pointer chasing

```text
address → load next address → load next address → ...
```

The next location is unknown until the current node arrives. That dependency
limits memory-level parallelism and makes prefetching more difficult. This is
one reason a theoretically suitable linked structure can lose to a contiguous
one in practice.

## 5. Same big-O, different traversal

These functions both visit every matrix element and perform `O(rows × cols)`
work. The matrix is stored in row-major order:

```rust
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

fn main() {
    let values: Vec<u64> = (0..24).collect();
    assert_eq!(row_major_sum(&values, 4, 6), 276);
    assert_eq!(column_major_sum(&values, 4, 6), 276);
}
```

The row-major loop consumes adjacent values. The column-major loop jumps by an
entire row. Their asymptotic complexity is identical, while their memory access
patterns differ.

Do not infer a fixed speed ratio from this example. Matrix size, compiler
optimization, cache geometry, prefetching, and the surrounding work all matter.

## 6. Representation is a performance decision

Compare two ways to represent a sequence:

```text
contiguous:     [value][value][value][value]

linked nodes:  [value|next]  →  [value|next]  →  [value|next]
```

Contiguous storage usually provides:

- Fewer allocations.
- Less pointer metadata.
- Predictable sequential addresses.
- More useful values per fetched line.
- Easier batching and vectorization.

Linked or handle-based storage still earns its place when stable identity,
cheap structural changes, or another required operation outweighs traversal
cost. The data-structure chapters describe those tradeoffs; the machine model
explains why the tradeoffs exist.

## 7. What the simplified simulator omits

Real cache behavior also depends on:

- Multiple cache levels and sharing between cores.
- Set and way placement rather than a fully associative cache.
- Hardware prefetchers.
- Cache coherence and writes.
- Virtual-to-physical address translation.
- Other processes, interrupts, and migrations.
- The compiler's ability to reorder or remove work.

Later chapters introduce these mechanisms separately. A model should be small
enough to predict while remaining honest about what it leaves out.

## 8. What you should internalize

1. An access retrieves a cache line, not an isolated language-level value.
2. Sequential access can reuse the rest of a fetched line.
3. Temporal locality keeps recently reused data close to the core.
4. Pointer dependencies can prevent the processor from looking ahead.
5. Equal big-O complexity does not imply equal data movement or latency.
6. Compact representations and predictable access are strong defaults, but
   measurement decides whether they matter for a particular workload.

## Exercise

For 64-byte lines containing four 16-byte records, predict the number of
distinct lines touched when reading records `0..16` sequentially and when
reading `0, 4, 8, 12`. Then change the simulator's cache capacity mentally from
three lines to two and trace the repeating access sequence `0, 4, 8, 0, 4, 8`.

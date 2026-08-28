# Data Layout — Array of Structures versus Structure of Arrays

The same logical records can occupy memory in different orders. That order
determines which fields share cache lines, which bytes a loop fetches but never
uses, and how easily the CPU can process many values together.

<div class="system-demo" data-system-demo="data-layout">
  <div class="system-demo-controls" aria-label="Data-layout controls">
    <label class="system-demo-field">Layout
      <select data-layout-kind>
        <option value="aos">Array of structures</option>
        <option value="soa">Structure of arrays</option>
      </select>
    </label>
    <label class="system-demo-field">Workload
      <select data-layout-workload>
        <option value="price">Price-only scan</option>
        <option value="full">Full-record processing</option>
      </select>
    </label>
    <button type="button" data-layout-action="step">Process next record</button>
    <button type="button" data-layout-action="run">Run workload</button>
    <button type="button" data-layout-action="reset">Reset</button>
  </div>
  <div class="system-demo-metrics" aria-live="polite">
    <span class="system-demo-metric"><strong data-layout-records>0</strong>records</span>
    <span class="system-demo-metric"><strong data-layout-lines>0</strong>lines fetched</span>
    <span class="system-demo-metric"><strong data-layout-efficiency>0%</strong>useful bytes</span>
  </div>
  <div class="layout-memory-lines" data-layout-memory role="img" aria-label="Conceptual record layout"></div>
  <p class="layout-legend"><code>P</code> price · <code>S</code> size · <code>T</code> timestamp · each field 8 B</p>
  <p class="system-demo-status" data-layout-status aria-live="polite"></p>
  <noscript>The interactive controls require JavaScript.</noscript>
</div>

The simulator uses eight records containing three 8-byte fields and conceptual
64-byte cache lines. It counts a line once after it has been fetched and assumes
the three lines remain resident. It isolates layout efficiency; it is not a
timing model or a complete cache simulator.

## When layout becomes a design decision

Layout deserves deliberate attention when:

- Hot loops process large batches of records.
- Most operations read only a subset of each record.
- Data volume exceeds the fastest caches.
- SIMD or accelerator-friendly contiguous inputs matter.
- Cold metadata is making hot records unnecessarily large.
- Measurement attributes meaningful time to loads, cache misses, or bandwidth.

Keep the simplest representation until the access pattern is understood. A
more specialized layout adds invariants and API complexity, which must earn
their cost through a real workload.

## 1. Array of structures

An **array of structures** stores complete records next to one another:

```text
[P0 S0 T0] [P1 S1 T1] [P2 S2 T2] ...
```

The direct Rust representation is a `Vec<Record>`:

```rust
#[derive(Clone, Copy)]
struct Quote {
    price: u64,
    size: u64,
    timestamp: u64,
}

fn notional(quotes: &[Quote]) -> u64 {
    quotes.iter().map(|quote| quote.price * quote.size).sum()
}

fn main() {
    let quotes = [
        Quote { price: 100, size: 4, timestamp: 10 },
        Quote { price: 101, size: 3, timestamp: 11 },
    ];
    assert_eq!(notional(&quotes), 703);
    assert_eq!(quotes[1].timestamp, 11);
}
```

This layout is natural when operations consume most fields of one record at a
time. A record can be borrowed, passed, inserted, or removed as one value, and
the type system keeps its fields together automatically.

The drawback appears when a loop needs only `price`: every fetched line also
contains sizes and timestamps that the loop may not use.

## 2. Structure of arrays

A **structure of arrays** stores each field in its own contiguous sequence:

```text
[P0 P1 P2 ...]
[S0 S1 S2 ...]
[T0 T1 T2 ...]
```

```rust
#[derive(Debug, PartialEq)]
struct Quote {
    price: u64,
    size: u64,
    timestamp: u64,
}

struct QuoteColumns {
    prices: Vec<u64>,
    sizes: Vec<u64>,
    timestamps: Vec<u64>,
}

impl QuoteColumns {
    fn push(&mut self, quote: Quote) {
        self.prices.push(quote.price);
        self.sizes.push(quote.size);
        self.timestamps.push(quote.timestamp);
    }

    fn get(&self, index: usize) -> Option<Quote> {
        Some(Quote {
            price: *self.prices.get(index)?,
            size: *self.sizes.get(index)?,
            timestamp: *self.timestamps.get(index)?,
        })
    }
}

fn main() {
    let mut quotes = QuoteColumns {
        prices: Vec::new(),
        sizes: Vec::new(),
        timestamps: Vec::new(),
    };
    quotes.push(Quote { price: 100, size: 4, timestamp: 10 });
    assert_eq!(quotes.get(0), Some(Quote { price: 100, size: 4, timestamp: 10 }));
}
```

A price-only scan now reads a dense price array without transferring unrelated
fields. Separate homogeneous arrays can also make vectorized processing easier.

The cost is a new invariant:

```text
prices.len() == sizes.len() == timestamps.len()
```

Every insert, removal, reorder, and error path must preserve it. Hiding the
columns behind methods is therefore part of the representation, not optional
API decoration.

## 3. The workload decides

| Access pattern | Often favors |
|---|---|
| Read or update one complete record | Array of structures |
| Scan one field across many records | Structure of arrays |
| Pass records through record-oriented APIs | Array of structures |
| Batch arithmetic over homogeneous values | Structure of arrays |
| Frequent insertion and removal of whole records | Usually array of structures |
| Stable column lengths and large analytical scans | Structure of arrays |

These are tendencies, not guarantees. Record size, alignment, selected fields,
batch size, compiler optimization, and hardware all affect the result.

## 4. Hot and cold field separation

The choice is not limited to two extremes. A system can keep fields used on the
critical path together and move rarely accessed metadata elsewhere:

```text
hot record:  price | size | side | state
cold table:  text | audit metadata | diagnostics | optional attributes
```

The hot record becomes smaller, so more of them fit in a line. The cold data is
resolved only when required. This is often easier to integrate into a
record-oriented design than converting everything into separate columns.

The tradeoff is another lookup and another lifetime relationship between hot
and cold storage.

## 5. Layout and vectorization

SIMD instructions apply one operation to several values at once. A contiguous
array of one numeric type is a convenient input:

```text
prices: [100, 101, 102, 103, 104, 105, 106, 107]
```

Interleaved records require the processor or compiler to gather the desired
fields before applying the same operation. Modern hardware can support gathers,
but contiguous loads remain a valuable target when the workload naturally
processes columns.

Do not rewrite code around assumed vectorization. Inspect optimized output or
profiling results and measure a representative batch.

## 6. Rust layout is not a serialization contract

Rust may insert padding so fields satisfy alignment requirements. The default
representation does not promise a stable cross-version or foreign-language
layout. `#[repr(C)]` provides C-compatible ordering and alignment rules when an
interface requires them, but padding may still exist.

Avoid treating ordinary structs as byte slices or network messages through
unchecked casts. In-memory layout, wire format, and persistent format are
different contracts even when their fields look similar.

## 7. What you should internalize

1. Logical records do not dictate one physical layout.
2. Array of structures keeps each record together.
3. Structure of arrays keeps each field together.
4. A field-only scan can waste bandwidth when unrelated fields share its lines.
5. Full-record processing often benefits from record locality and simpler APIs.
6. Columnar storage introduces length and mutation invariants.
7. Hybrid hot/cold layouts are often more practical than either extreme.
8. Choose from the measured access pattern, not from a universal layout rule.

## Exercise

Add a `side: u8` and a 32-byte identifier to the conceptual quote. Decide which
fields belong on the hot path for a price-and-size aggregation. Design an AoS,
SoA, or hybrid representation, then list the invariants its insertion and
removal methods must preserve.

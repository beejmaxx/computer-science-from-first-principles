# 9. `BTreeSet` — Ordered Membership

`BTreeSet<T>` stores unique values in sorted order. It answers membership
questions like a `HashSet`, while also supporting ordered traversal, range
queries, and efficient access to the smallest and greatest values.

<div class="ds-demo" data-demo="btree-set"></div>

## When to use `BTreeSet`

Use it when:

- Values must remain unique and sorted.
- You need every value within a range.
- You need the smallest, greatest, predecessor, or successor value.
- Deterministic traversal is part of the program's behavior.
- Values implement `Ord` but are inconvenient to hash.

The decision rule is:

> Use `BTreeSet` when presence and order both matter.

Use `HashSet` when you only need membership and expected constant-time lookup.
Use a sorted `Vec` when updates are rare and compact storage or fast sequential
scans matter more than insertion cost.

## 1. The essential mental model

A `BTreeSet<T>` is conceptually a `BTreeMap<T, ()>`: each stored value acts as a
key, and there is no separate associated value.

The values live in a balanced B-tree whose nodes contain several sorted values:

```text
                    [ 20 | 50 ]
                   /     |     \
          [ 5 | 10 ] [30 | 40] [60 | 80]
```

Each comparison chooses the child containing the relevant range. All leaves
stay at the same depth, preventing the structure from degrading into a long
one-sided chain.

The exact node layout is private, but three properties define the useful model:

1. Every value is unique.
2. Traversal follows `Ord`.
3. The tree remains balanced as values are inserted and removed.

## 2. The basic API

```rust
use std::collections::BTreeSet;

fn main() {
    let mut prices = BTreeSet::new();

    assert!(prices.insert(103));
    assert!(prices.insert(101));
    assert!(prices.insert(107));
    assert!(!prices.insert(103));

    assert!(prices.contains(&101));
    assert!(prices.remove(&103));
    assert!(!prices.contains(&103));

    let ordered: Vec<_> = prices.into_iter().collect();
    assert_eq!(ordered, vec![101, 107]);
}
```

`insert` returns `true` only when the value was new. `remove` returns whether a
matching value existed.

## 3. Ordered traversal

Insertion order does not affect iteration order:

```rust
use std::collections::BTreeSet;

fn main() {
    let values = BTreeSet::from([40, 10, 30, 20]);
    let ordered: Vec<_> = values.iter().copied().collect();

    assert_eq!(ordered, vec![10, 20, 30, 40]);
    assert_eq!(values.first(), Some(&10));
    assert_eq!(values.last(), Some(&40));
}
```

This makes `BTreeSet` useful for timelines, price levels, ordered IDs, and
deterministic output.

## 4. Range queries

A range begins near its lower boundary and visits only matching values:

```rust
use std::collections::BTreeSet;

fn main() {
    let prices = BTreeSet::from([95, 100, 101, 103, 108, 110]);

    let nearby: Vec<_> = prices.range(100..=108).copied().collect();
    assert_eq!(nearby, vec![100, 101, 103, 108]);
}
```

A `HashSet` cannot answer this query without examining every value.

## 5. Predecessors and successors

Range iterators can locate the nearest stored value on either side of a target:

```rust
use std::collections::BTreeSet;

fn main() {
    let levels = BTreeSet::from([100, 103, 107, 112]);

    let at_or_below = levels.range(..=105).next_back();
    let at_or_above = levels.range(105..).next();

    assert_eq!(at_or_below, Some(&103));
    assert_eq!(at_or_above, Some(&107));
}
```

This is useful for price ladders, schedules, thresholds, and sparse numeric
domains.

## 6. Set operations

```rust
use std::collections::BTreeSet;

fn main() {
    let left = BTreeSet::from([1, 2, 3]);
    let right = BTreeSet::from([3, 4, 5]);

    let intersection: Vec<_> = left.intersection(&right).copied().collect();
    let union: Vec<_> = left.union(&right).copied().collect();
    let difference: Vec<_> = left.difference(&right).copied().collect();
    let symmetric: Vec<_> = left.symmetric_difference(&right).copied().collect();

    assert_eq!(intersection, vec![3]);
    assert_eq!(union, vec![1, 2, 3, 4, 5]);
    assert_eq!(difference, vec![1, 2]);
    assert_eq!(symmetric, vec![1, 2, 4, 5]);
}
```

The results arrive in sorted order. The operations return borrowing iterators,
so collecting is unnecessary when values can be processed immediately.

## 7. Set relationships

```rust
use std::collections::BTreeSet;

fn main() {
    let required = BTreeSet::from(["read", "write"]);
    let granted = BTreeSet::from(["admin", "read", "write"]);

    assert!(required.is_subset(&granted));
    assert!(granted.is_superset(&required));
    assert!(!required.is_disjoint(&granted));
}
```

These relationships express permissions, capabilities, classifications, and
dependency requirements directly.

## 8. Taking ownership of a stored value

`take` removes and returns the value equal to a borrowed lookup key:

```rust
use std::collections::BTreeSet;

#[derive(Debug, Eq, Ord, PartialEq, PartialOrd)]
struct Session {
    id: u32,
}

fn main() {
    let mut sessions = BTreeSet::from([
        Session { id: 10 },
        Session { id: 20 },
    ]);

    let removed = sessions.take(&Session { id: 10 });
    assert_eq!(removed, Some(Session { id: 10 }));
    assert_eq!(sessions.len(), 1);
}
```

For richer records, ensure the implemented ordering represents identity
correctly. If comparison includes every field, a lookup value must match every
field—not merely an ID.

## 9. Complexity

| Operation | Complexity |
|---|---:|
| `contains`, `insert`, `remove`, `take` | `O(log n)` |
| `first`, `last` | `O(log n)` |
| Iterate all values | `O(n)` |
| Iterate `k` values in a range | `O(log n + k)` |
| Set operation over sets of sizes `n` and `m` | `O(n + m)` |

The asymptotic comparison with `HashSet` is only part of the decision. Tree
operations provide deterministic order and range behavior that a hash table
does not provide at all.

## 10. `BTreeSet`, `HashSet`, or sorted `Vec`?

| Requirement | Start with |
|---|---|
| Expected constant-time membership | `HashSet<T>` |
| Sorted iteration with ongoing updates | `BTreeSet<T>` |
| Range and neighbor queries | `BTreeSet<T>` |
| Compact sorted data with rare updates | `Vec<T>` |
| Preserve first-occurrence order while deduplicating | `Vec<T>` plus a set |

A sorted vector supports binary-search membership in `O(log n)` and has
excellent locality, but insertion and removal shift elements. It can beat a
tree when the collection is built once and queried many times.

## 11. Ordering defines uniqueness

`BTreeSet` considers two values duplicates when `Ord::cmp` returns `Equal`.
Ordering and equality must agree.

This matters for records with custom comparison. If comparison uses only a
timestamp, two distinct events with the same timestamp will be treated as one
set value. Add a sequence number or unique ID when ties must remain distinct.

Values must not change their relative ordering while stored in the set. Doing
so through interior mutability is a logic error that can produce incorrect
results, even though Rust's memory safety remains intact.

## 12. Sharp edges

- `BTreeSet` requires `Ord`; ordinary floating-point types do not implement a
  total order suitable for it.
- There is no positional indexing. A B-tree is ordered by value, not array
  position.
- Deterministic traversal is useful only when order has meaning. Sorting at an
  output boundary may be clearer when it does not.
- Tree nodes and comparisons add overhead; benchmark against a sorted vector
  for read-heavy, mostly static data.
- A set records presence, not multiplicity. Use a map from value to count when
  duplicates must be counted.

## 13. What you should internalize

1. `BTreeSet` stores unique values in sorted order.
2. It provides `O(log n)` membership and updates.
3. Range, predecessor, successor, first, and last queries are its strengths.
4. Ordering defines both traversal and uniqueness.
5. `HashSet` is the default when order is irrelevant.
6. A sorted `Vec` can be better when updates are rare.

## Exercise

Store a set of timestamps, then implement queries for the nearest timestamp at
or before a target and the nearest timestamp at or after it. Include targets
below and above every stored value.

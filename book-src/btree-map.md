# 6. `BTreeMap` — An Ordered Map

`BTreeMap<K, V>` associates unique keys with values while keeping the keys in
sorted order. It is implemented as a balanced search tree with nodes containing
multiple entries.

<div class="ds-demo" data-demo="btree-map"></div>

## When to use `BTreeMap`

Use it when:

- Iteration must follow key order.
- You need all entries within a key range.
- You need the first or last key efficiently.
- Deterministic traversal is part of the program's behavior.
- Keys implement `Ord` but are inconvenient to hash.

The decision rule is:

> Use `BTreeMap` when ordering is a required operation, not merely a preferred
> appearance in debug output.

Use `HashMap` for general key lookup when order is irrelevant.

## 1. The essential mental model

A B-tree is a balanced search tree whose nodes hold several sorted keys:

```text
                 [ 20 | 50 ]
                /     |     \
       [ 5 | 10 ] [30 | 40] [60 | 80]
```

Each comparison chooses a child containing the requested key range. All leaves
remain at the same depth, so operations do not degrade into walking a long,
one-sided chain.

Storing several keys per node improves locality and reduces tree height
compared with a one-key-per-node binary search tree.

## 2. The basic API

```rust
use std::collections::BTreeMap;

fn main() {
    let mut scores = BTreeMap::new();
    scores.insert("carol", 30);
    scores.insert("alice", 10);
    scores.insert("bob", 20);

    assert_eq!(scores.get("bob"), Some(&20));

    let names: Vec<_> = scores.keys().copied().collect();
    assert_eq!(names, vec!["alice", "bob", "carol"]);
}
```

Insertion order does not affect traversal order. Keys are yielded according to
`Ord`.

## 3. Range queries

Ranges are the defining advantage over a hash map:

```rust
use std::collections::BTreeMap;

fn main() {
    let temperatures = BTreeMap::from([
        (8, 14.0),
        (9, 15.5),
        (10, 17.0),
        (11, 18.5),
        (12, 20.0),
    ]);

    let morning: Vec<_> = temperatures
        .range(9..=11)
        .map(|(&hour, &temperature)| (hour, temperature))
        .collect();

    assert_eq!(morning, vec![(9, 15.5), (10, 17.0), (11, 18.5)]);
}
```

The map finds the range boundary, then walks only the matching entries.

## 4. Extremes and neighboring keys

```rust
use std::collections::BTreeMap;

fn main() {
    let prices = BTreeMap::from([(101, "one"), (103, "three"), (107, "seven")]);

    assert_eq!(prices.first_key_value(), Some((&101, &"one")));
    assert_eq!(prices.last_key_value(), Some((&107, &"seven")));

    let at_or_below_105 = prices.range(..=105).next_back();
    assert_eq!(at_or_below_105, Some((&103, &"three")));
}
```

This pattern is useful for timelines, price levels, interval boundaries, and
configuration that changes at ordered thresholds.

## 5. Complexity

| Operation | Complexity |
|---|---:|
| `get`, `insert`, `remove` | `O(log n)` |
| First or last entry | `O(log n)` |
| Iterate all entries | `O(n)` |
| Iterate `k` entries in a range | `O(log n + k)` |

Although `HashMap` offers expected `O(1)` lookup, `BTreeMap` may still perform
well because its nodes group entries and traversal has predictable locality.
Choose based on required behavior and measurements.

## 6. `BTreeMap` versus `HashMap`

| Requirement | Prefer |
|---|---|
| General lookup with no order | `HashMap` |
| Sorted iteration | `BTreeMap` |
| Range queries | `BTreeMap` |
| First, last, predecessor, or successor queries | `BTreeMap` |
| Keys naturally implement `Hash + Eq` | usually `HashMap` |
| Keys naturally implement `Ord` | `BTreeMap` may be simpler |

Do not select `BTreeMap` solely to make a snapshot test deterministic if order
has no semantic meaning; sorting only at the output boundary may express the
requirement more accurately.

## 7. What you should internalize

1. `BTreeMap` stores key-value pairs in key order.
2. Lookup and updates are `O(log n)`.
3. Range queries and ordered traversal are its central strengths.
4. It requires `Ord`, while `HashMap` requires `Eq + Hash`.
5. Choose it when ordering is part of the problem.

## Exercise

Represent price levels as `BTreeMap<i64, u64>`. Find the best ask, best bid,
and every level within five ticks of a supplied price without scanning the
entire map.

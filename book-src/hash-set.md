# `HashSet` — Membership and Uniqueness

`HashSet<T>` stores unique values and answers whether a value is present. It is
conceptually a `HashMap<T, ()>`: the keys matter, but there is no separate value
associated with each key.

<div class="ds-demo" data-demo="hash-set"></div>

## When to use `HashSet`

Use it for:

- Removing duplicates.
- Tracking visited nodes or processed IDs.
- Fast membership checks.
- Comparing groups with union, intersection, and difference.
- Enforcing uniqueness in memory.

The decision rule is:

> Use `HashSet` when presence is the information you need.

Use `HashMap` when each key needs associated data, `BTreeSet` when sorted order
or ranges matter, and a bit set when the universe is small and densely numbered.

## 1. The basic API

```rust
use std::collections::HashSet;

fn main() {
    let mut active = HashSet::new();

    assert!(active.insert("alice"));
    assert!(!active.insert("alice"));
    assert!(active.contains("alice"));
    assert!(active.remove("alice"));
    assert!(!active.contains("alice"));
}
```

`insert` returns `true` only when the value was not already present. `remove`
returns whether a value was found.

## 2. Deduplication

```rust
use std::collections::HashSet;

fn main() {
    let events = ["login", "trade", "login", "logout", "trade"];
    let unique: HashSet<_> = events.into_iter().collect();

    assert_eq!(unique.len(), 3);
    assert!(unique.contains("login"));
    assert!(unique.contains("trade"));
    assert!(unique.contains("logout"));
}
```

Iteration order is unspecified. If first-occurrence order must be preserved,
collecting directly into `HashSet` is not sufficient by itself.

## 3. Tracking visited values

The return value from `insert` combines “check” and “mark” into one lookup:

```rust
use std::collections::HashSet;

fn main() {
    let stream = [4, 2, 4, 1, 2, 3];
    let mut seen = HashSet::new();
    let mut first_occurrences = Vec::new();

    for value in stream {
        if seen.insert(value) {
            first_occurrences.push(value);
        }
    }

    assert_eq!(first_occurrences, vec![4, 2, 1, 3]);
}
```

This pattern appears in graph traversal, event processing, and cycle
detection.

## 4. Set operations

```rust
use std::collections::HashSet;

fn main() {
    let left = HashSet::from([1, 2, 3]);
    let right = HashSet::from([3, 4, 5]);

    let intersection: HashSet<_> = left.intersection(&right).copied().collect();
    let union: HashSet<_> = left.union(&right).copied().collect();
    let difference: HashSet<_> = left.difference(&right).copied().collect();

    assert_eq!(intersection, HashSet::from([3]));
    assert_eq!(union, HashSet::from([1, 2, 3, 4, 5]));
    assert_eq!(difference, HashSet::from([1, 2]));
}
```

The iterators borrow the original sets. Collect only when an owned result is
needed.

## 5. Complexity

| Operation | Expected complexity | Worst case |
|---|---:|---:|
| `contains` | `O(1)` | `O(n)` |
| `insert`, `remove` | amortized `O(1)` | `O(n)` |
| Iterate | `O(capacity)` | `O(capacity)` |

As with `HashMap`, expected constant-time behavior depends on hash distribution.

## 6. Set relationships

```rust
use std::collections::HashSet;

fn main() {
    let required = HashSet::from(["read", "write"]);
    let granted = HashSet::from(["read", "write", "admin"]);

    assert!(required.is_subset(&granted));
    assert!(granted.is_superset(&required));
    assert!(!required.is_disjoint(&granted));
}
```

These methods often communicate authorization, feature, or classification
logic more directly than nested membership checks.

## 7. Sharp edges

- Values require `Eq + Hash`.
- Iteration order is not stable or sorted.
- Mutating a stored value so its hash or equality changes is a logic error.
- A set answers presence, not multiplicity. Use `HashMap<T, usize>` for counts.
- Hash-based uniqueness follows `Eq`, which may differ from domain-level ideas
  such as case-insensitive equality unless the type encodes them.

## 8. What you should internalize

1. `HashSet` stores unique values without associated data.
2. Membership is expected `O(1)`.
3. `insert` conveniently reports whether a value was new.
4. Set operations express comparisons between groups.
5. Use `BTreeSet` when sorted traversal or ranges matter.

## Exercise

Given yesterday's and today's active symbol sets, compute added, removed, and
unchanged symbols. Assert the three groups for a small example.

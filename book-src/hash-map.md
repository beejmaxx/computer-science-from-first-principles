# 5. `HashMap` — Key-Value Lookup

`HashMap<K, V>` associates unique keys with values. It uses a key's hash to
locate the region where that key should be stored.

<div class="ds-demo" data-demo="hash-map"></div>

## When to use `HashMap`

Use it for:

- Looking up records by ID or name.
- Counting occurrences.
- Grouping values by a derived key.
- Caches and indexes.
- Representing sparse relationships.

The decision rule is:

> Use `HashMap` when the question is “what value belongs to this key?” and key
> order is unimportant.

Use `BTreeMap` when sorted keys or range queries matter, and a sequence when
position rather than identity determines access.

## 1. The essential mental model

A hash function converts a key into a number. The map uses that number to find
a bucket or probe sequence, then uses equality to identify the exact key.

```text
key ──hash──▶ candidate location ──equality──▶ matching entry
```

Different keys can produce the same candidate location. This is a collision,
and a correct hash map resolves it. Keys must obey one invariant: equal keys
must produce equal hashes.

## 2. The basic API

```rust
use std::collections::HashMap;

fn main() {
    let mut ports = HashMap::new();
    ports.insert("http", 80);
    ports.insert("https", 443);

    assert_eq!(ports.get("https"), Some(&443));
    assert!(ports.contains_key("http"));
    assert_eq!(ports.remove("http"), Some(80));
    assert_eq!(ports.get("http"), None);
}
```

`insert` returns the previous value when the key already exists. `get` borrows
the value; `remove` moves it out.

## 3. The `entry` API

`entry` performs one lookup and then lets code modify or create the value:

```rust
use std::collections::HashMap;

fn main() {
    let mut counts = HashMap::new();

    for word in "red blue red green red blue".split_whitespace() {
        *counts.entry(word).or_insert(0) += 1;
    }

    assert_eq!(counts["red"], 3);
    assert_eq!(counts["blue"], 2);
    assert_eq!(counts["green"], 1);
}
```

This is clearer and avoids a redundant lookup compared with checking first and
inserting later.

## 4. Grouping by key

```rust
use std::collections::HashMap;

fn main() {
    let records = [("error", 10), ("info", 20), ("error", 30)];
    let mut grouped: HashMap<&str, Vec<i32>> = HashMap::new();

    for (level, value) in records {
        grouped.entry(level).or_default().push(value);
    }

    assert_eq!(grouped["error"], vec![10, 30]);
    assert_eq!(grouped["info"], vec![20]);
}
```

The map provides keyed access; each value can itself be another collection.

## 5. Complexity

| Operation | Expected complexity | Worst case |
|---|---:|---:|
| `get`, `contains_key` | `O(1)` | `O(n)` |
| `insert`, `remove` | amortized `O(1)` | `O(n)` |
| Iterate | `O(capacity)` | `O(capacity)` |

Constant-time lookup is an expected property under a well-distributed hash, not
an unconditional guarantee. Growth may also allocate and reorganize entries.

## 6. Keys and ownership

Owned keys make the map independent of its input:

```rust
use std::collections::HashMap;

fn main() {
    let mut users = HashMap::new();
    users.insert(String::from("alice"), 42);

    // A borrowed `&str` can look up an owned `String` key.
    assert_eq!(users.get("alice"), Some(&42));
}
```

A map can store borrowed keys, but then it cannot outlive the data those keys
reference. Owned keys are often the simpler API boundary.

## 7. Iteration order

`HashMap` does not promise insertion order or sorted order. Do not write logic
or tests that depend on the order produced by iteration.

When deterministic sorted output is needed, sort the collected keys or use a
`BTreeMap`. When insertion order is part of the requirement, use a collection
that explicitly guarantees it.

## 8. Sharp edges

- Keys require `Eq + Hash`.
- Mutating a key so its hash or equality changes while stored in the map is a
  logic error.
- `map[key]` panics when the key is absent; `get` returns `Option<&V>`.
- A hash map does not preserve ordering.
- Reserving capacity does not insert entries.

## 9. What you should internalize

1. A hash map associates unique keys with values.
2. Hashing finds candidates; equality confirms the key.
3. Lookup is expected `O(1)`, not ordered.
4. `entry` is the central tool for update-or-insert logic.
5. Choose `BTreeMap` when order and ranges are requirements.

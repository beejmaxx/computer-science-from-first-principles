# LRU Cache — Lookup Plus Recency

An LRU cache evicts the **least recently used** entry when capacity is full. It
combines keyed lookup with an ordering that changes on every hit.

<div class="ds-demo" data-demo="lru"></div>

## When to use it

Use LRU when recent access predicts future access and storage is bounded. Avoid
it when entries have explicit expiration, frequency matters more than recency,
or every read becoming a metadata write creates too much contention.

## 1. Two structures, two questions

```text
HashMap:  where is key K?
Recency:  which key is oldest?
```

A simple safe implementation uses `HashMap<K, V>` plus `VecDeque<K>`. Hits scan
the deque, so they are `O(n)`, but the design is often excellent for small
caches.

```rust
use std::collections::{HashMap, VecDeque};
use std::hash::Hash;

struct Lru<K, V> {
    capacity: usize,
    values: HashMap<K, V>,
    order: VecDeque<K>,
}

impl<K: Clone + Eq + Hash, V> Lru<K, V> {
    fn new(capacity: usize) -> Self {
        assert!(capacity > 0);
        Self { capacity, values: HashMap::new(), order: VecDeque::new() }
    }

    fn get(&mut self, key: &K) -> Option<&V> {
        let position = self.order.iter().position(|stored| stored == key)?;
        let key = self.order.remove(position).unwrap();
        self.order.push_back(key.clone());
        self.values.get(&key)
    }

    fn insert(&mut self, key: K, value: V) {
        if let Some(position) = self.order.iter().position(|stored| stored == &key) {
            self.order.remove(position);
        } else if self.values.len() == self.capacity {
            let oldest = self.order.pop_front().unwrap();
            self.values.remove(&oldest);
        }
        self.order.push_back(key.clone());
        self.values.insert(key, value);
    }
}

fn main() {
    let mut cache = Lru::new(2);
    cache.insert("a", 1);
    cache.insert("b", 2);
    assert_eq!(cache.get(&"a"), Some(&1));
    cache.insert("c", 3);
    assert_eq!(cache.get(&"b"), None);
    assert_eq!(cache.get(&"a"), Some(&1));
}
```

## 2. Strict constant time

Strict expected `O(1)` operations require a hash map pointing to nodes in a
doubly linked recency list. In safe Rust, generational arena handles are a
natural representation. The map resolves a node; handles unlink and relink it
without searching.

## 3. Alternatives

- A stale-generation deque log gives amortized `O(1)` but needs compaction.
- CLOCK approximates recency with a reference bit.
- Segmented policies protect frequently reused entries.
- TTL caches order by expiration rather than access.

## 4. What you should internalize

LRU is a composition, not one container. “Best” depends on capacity, contention,
memory bounds, and whether strict recency is actually required.

## Exercise

Trace a capacity-three cache through `A, B, C, A, D, C`. Record the recency
order after each access, then update the example to count hits, misses, and
evictions.

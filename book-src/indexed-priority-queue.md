# 18. Indexed Priority Queue — Mutable Priorities

An indexed priority queue combines a heap with a map from item identity to heap
position. It supports changing or removing an arbitrary item's priority without
scanning the entire heap.

## When to use it

Use it for schedulers with cancellation, Dijkstra variants with decrease-key,
order queues with priority updates, and simulations whose future events change.

<div class="ds-demo" data-demo="indexed-heap"></div>

## 1. Invariant

```text
heap[index].key = K  ⇔  positions[K] = index
```

Every heap swap must update both position entries. After a priority change,
bubble the item upward or downward to restore heap order.

```rust
use std::collections::HashMap;

struct IndexedHeap {
    heap: Vec<(String, i32)>,
    positions: HashMap<String, usize>,
}

impl IndexedHeap {
    fn new() -> Self { Self { heap: Vec::new(), positions: HashMap::new() } }

    fn swap(&mut self, a: usize, b: usize) {
        self.heap.swap(a, b);
        self.positions.insert(self.heap[a].0.clone(), a);
        self.positions.insert(self.heap[b].0.clone(), b);
    }

    fn push(&mut self, key: String, priority: i32) {
        assert!(!self.positions.contains_key(&key));
        let mut index = self.heap.len();
        self.heap.push((key.clone(), priority));
        self.positions.insert(key, index);
        while index > 0 {
            let parent = (index - 1) / 2;
            if self.heap[parent].1 >= self.heap[index].1 { break; }
            self.swap(parent, index);
            index = parent;
        }
    }

    fn update(&mut self, key: &str, priority: i32) {
        let mut index = self.positions[key];
        let old = self.heap[index].1;
        self.heap[index].1 = priority;
        if priority > old {
            while index > 0 {
                let parent = (index - 1) / 2;
                if self.heap[parent].1 >= self.heap[index].1 { break; }
                self.swap(parent, index);
                index = parent;
            }
        } else {
            loop {
                let left = index * 2 + 1;
                if left >= self.heap.len() { break; }
                let right = left + 1;
                let child = if right < self.heap.len()
                    && self.heap[right].1 > self.heap[left].1 { right } else { left };
                if self.heap[index].1 >= self.heap[child].1 { break; }
                self.swap(index, child);
                index = child;
            }
        }
    }
}

fn main() {
    let mut queue = IndexedHeap::new();
    queue.push("compile".into(), 2);
    queue.push("deploy".into(), 5);
    queue.update("compile", 8);
    assert_eq!(queue.heap[0], ("compile".into(), 8));
}
```

Lookup is expected `O(1)`; insertion and priority change are `O(log n)`. The
map/heap synchronization invariant is the structure's main source of bugs.

## 2. What you should internalize

An ordinary heap exposes only its root. Adding an index map makes arbitrary
items addressable, but every structural change must maintain two coordinated
representations.

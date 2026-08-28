# 11. Disjoint Set — Dynamic Connectivity

A disjoint-set union structure—also called **union-find**—maintains a partition
of elements into non-overlapping groups.

## When to use it

Use union-find when edges are added and you repeatedly ask whether two elements
are connected. It appears in Kruskal's minimum spanning tree, clustering,
network connectivity, and cycle detection in undirected graphs.

<div class="ds-demo" data-demo="union-find"></div>

It does not support efficient arbitrary edge deletion or shortest paths.

## 1. The essential mental model

Each group is a tree whose root represents the group:

```text
0 ← 1 ← 3       2 ← 4
```

`find(x)` follows parents to a root. `union(a, b)` connects two roots.

Two optimizations make it extremely fast:

- **Union by size:** attach the smaller tree beneath the larger.
- **Path compression:** make visited nodes point directly to the root.

## 2. Complete implementation

```rust
struct DisjointSet {
    parent: Vec<usize>,
    size: Vec<usize>,
}

impl DisjointSet {
    fn new(len: usize) -> Self {
        Self {
            parent: (0..len).collect(),
            size: vec![1; len],
        }
    }

    fn find(&mut self, value: usize) -> usize {
        if self.parent[value] != value {
            self.parent[value] = self.find(self.parent[value]);
        }
        self.parent[value]
    }

    fn union(&mut self, left: usize, right: usize) -> bool {
        let mut a = self.find(left);
        let mut b = self.find(right);
        if a == b {
            return false;
        }
        if self.size[a] < self.size[b] {
            std::mem::swap(&mut a, &mut b);
        }
        self.parent[b] = a;
        self.size[a] += self.size[b];
        true
    }

    fn connected(&mut self, left: usize, right: usize) -> bool {
        self.find(left) == self.find(right)
    }
}

fn main() {
    let mut sets = DisjointSet::new(6);
    assert!(sets.union(0, 1));
    assert!(sets.union(1, 2));
    assert!(sets.connected(0, 2));
    assert!(!sets.connected(0, 5));
    assert!(!sets.union(0, 2));
}
```

With both optimizations, operations take amortized `O(α(n))`, where the inverse
Ackermann function grows so slowly that it is effectively constant for
realistic inputs.

## 3. Invariants

- Every parent is a valid index.
- A root is its own parent.
- Only a root's size is authoritative.
- `union` changes parents only at roots.

Union-find answers connectivity, not the actual path connecting two elements.

## 4. What you should internalize

Union-find is specialized and exceptionally efficient: it maintains connected
components under additions. Path compression speeds future queries; union by
size prevents tall trees.

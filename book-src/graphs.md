# Graphs — Choosing a Representation

A graph contains **vertices** connected by **edges**. The representation is not
an implementation detail: it determines which graph operations are cheap.

<div class="ds-demo" data-demo="graph"></div>

## When to use a graph

Use a graph for networks, dependencies, routes, state transitions, ownership
relationships, or any domain where arbitrary entities connect to one another.

> Choose the representation from the queries: neighbor traversal, edge lookup,
> global edge processing, or dense connectivity.

## 1. Adjacency list

An adjacency list stores each vertex's outgoing neighbors:

```rust
use std::collections::VecDeque;

fn bfs(graph: &[Vec<usize>], start: usize) -> Vec<usize> {
    let mut seen = vec![false; graph.len()];
    let mut queue = VecDeque::from([start]);
    let mut order = Vec::new();
    seen[start] = true;

    while let Some(node) = queue.pop_front() {
        order.push(node);
        for &next in &graph[node] {
            if !seen[next] {
                seen[next] = true;
                queue.push_back(next);
            }
        }
    }
    order
}

fn main() {
    let graph = vec![vec![1, 2], vec![3], vec![3], vec![]];
    assert_eq!(bfs(&graph, 0), vec![0, 1, 2, 3]);
}
```

For `V` vertices and `E` edges, storage is `O(V + E)`. Traversing a vertex's
neighbors costs `O(degree)`. This is the default for sparse graphs.

## 2. Other representations

| Representation | Storage | Strength |
|---|---:|---|
| Adjacency list | `O(V + E)` | Neighbor traversal in sparse graphs |
| Adjacency matrix | `O(V²)` | Constant-time edge existence |
| Edge list | `O(E)` | Process or sort every edge |
| Map of adjacency sets | `O(V + E)` plus overhead | Named nodes and edge updates |
| Arena-backed nodes | `O(V + E)` | Stable handles and rich node state |

An undirected edge normally appears in both adjacency lists. A weighted graph
stores `(neighbor, weight)` rather than only the neighbor.

## 3. Identity and deletion

Dense integer IDs make `Vec<Vec<usize>>` simple and fast. If nodes are removed
and slots reused, bare indices can become stale. Generational arena handles
prevent an old edge from silently pointing to a new occupant.

## 4. Core algorithms

- BFS uses a queue and finds shortest paths in unweighted graphs.
- DFS uses a stack or recursion and explores reachability and structure.
- Dijkstra uses a min-priority queue for nonnegative weighted edges.
- Topological sorting orders a directed acyclic graph.
- Minimum-spanning-tree algorithms use sorted edges or a priority queue.

## 5. What you should internalize

Graphs have no single best storage type. Start with an adjacency list for sparse
graphs, then change representation only when edge lookup, density, identity, or
mutation demands it.

## Exercise

Modify the BFS example to return the shortest path from `start` to a target,
not merely visitation order. Return `None` when the target is unreachable.

# Graph Traversal and Dependency Ordering

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Essential Algorithms</span></p>

Graphs model reachability, dependencies, routes, and state transitions. The representation and traversal frontier usually matter as much as the abstract algorithm.

## Planned model

Run BFS, DFS, Dijkstra, and topological sorting over the same small graph while exposing the frontier, visited state, and adjacency reads.

## Questions

- When is a queue, stack, or priority queue the correct frontier?
- What invariant makes a node final?
- How do dense and sparse representations change traversal cost?

## Exercise

Detect a dependency cycle and produce a valid processing order when no cycle exists.

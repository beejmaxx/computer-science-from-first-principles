# Roadmap

Data Structures in Rust grows one independent chapter at a time. This is a pool
of useful next topics, not a required reading order.

The foundational data-structure curriculum is now represented in the book.

## Specialized contiguous storage

- `SmallVec` and `ArrayVec`: when inline capacity is worth the tradeoff
- Sparse sets: dense iteration with fast integer-key membership
- Gap buffers and ropes: editing text without repeatedly moving everything

## Range and order structures

- Fenwick trees: prefix aggregates with compact storage
- Segment trees: mutable range queries
- Skip lists: probabilistic ordered search
- Radix trees: compact prefix lookup

## Graph and search structures

- Adjacency matrices: dense graphs and constant-time edge checks
- Compressed sparse row storage: compact static graphs
- Spatial indexes: k-d trees, quadtrees, and R-trees

## Market-oriented structures

- Order-book price levels: ordered prices with FIFO queues
- Timing wheels: large numbers of scheduled expirations
- Lock-free ring buffers: bounded producer-consumer streams

## Chapter rule

A topic graduates from this list when it has a concrete motivating problem, a
complete runnable example, a predictive mental model, honest alternatives, and
sharp edges worth remembering.

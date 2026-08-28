# NUMA and Memory Placement

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> The Machine</span></p>

In a NUMA system, memory latency depends on which CPU accesses which physical pages. CPU placement and memory placement therefore form one decision.

## Planned model

Place threads and pages on two sockets, then animate local and remote accesses, interconnect traffic, first-touch placement, and migration.

## Questions

- Who determines a page's initial NUMA node?
- When does replication beat shared remote access?
- How can a thread be pinned correctly while its data remains remote?

## Exercise

Partition a read-mostly table and mutable worker state across two sockets and explain every cross-node access that remains.

# Pages, B-Trees, LSM Trees, and WALs

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Storage and Database Internals</span></p>

Storage engines organize durable state around page-sized I/O, ordered indexes, append-friendly structures, and logs that make recovery possible.

## Planned model

Apply inserts and reads to a B-tree and an LSM-style design. Animate page splits, memtables, flushes, compaction, WAL records, and write amplification.

## Questions

- Which writes must become durable before acknowledgement?
- Why do B-trees and LSM trees favor different workloads?
- Where do read, write, and space amplification arise?

## Exercise

Choose a storage layout for an append-heavy workload with recent-key reads and state the compaction and recovery costs.

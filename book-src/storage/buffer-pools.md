# Buffer Pools and Caching

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Storage and Database Internals</span></p>

A buffer pool keeps selected storage pages in memory, tracks dirty state and pins, and decides which page to evict when capacity is exhausted.

## Planned model

Replay page references through LRU, CLOCK, and scan-resistant policies. Show hits, misses, pinned pages, dirty writeback, and eviction stalls.

## Questions

- Why can a sequential scan evict a valuable working set?
- What prevents a pinned page from being reclaimed?
- How does the database cache interact with the OS page cache?

## Exercise

Choose an eviction and writeback policy for mixed point-lookups and large analytical scans.

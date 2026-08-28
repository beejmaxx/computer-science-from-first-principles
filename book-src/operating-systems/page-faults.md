# Page Faults, Memory Locking, and Huge Pages

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Operating Systems and Execution</span></p>

An address can be valid without its page being immediately usable. Fault handling, page population, locking, and page size change latency and translation cost.

## Planned model

Touch pages in an allocated region and distinguish minor faults, major faults, zero-fill, copy-on-write, locked memory, and huge-page translation coverage.

## Questions

- Why does reserving memory not guarantee that every page is resident?
- What does prefaulting accomplish?
- Which tradeoffs accompany huge pages and memory locking?

## Exercise

Prepare a fixed working set before a critical loop and describe what residual page-related delays can still occur.

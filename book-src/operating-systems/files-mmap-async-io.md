# Files, Memory Mapping, and Asynchronous I/O

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Operating Systems and Execution</span></p>

Buffered reads, memory mappings, and asynchronous requests expose different interfaces to the same storage and page-cache machinery.

## Planned model

Trace data from a file through page cache, copying, faults, queued requests, completion, dirty pages, and writeback.

## Questions

- When does `mmap` avoid copying, and when does it merely defer work to faults?
- What does asynchronous I/O make asynchronous?
- Which durability guarantees require explicit synchronization?

## Exercise

Choose an I/O design for replaying a large append-only log while bounding stalls and memory use.

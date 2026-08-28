# Profiling CPU, Allocation, Locks, and I/O

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Performance Engineering</span></p>

Different profilers answer different questions. CPU samples, allocation events, lock waits, scheduler traces, and I/O traces cannot be collapsed into one universal profile.

## Planned model

Inject known CPU, allocation, contention, and I/O delays into a pipeline, then reveal what sampling, tracing, and instrumentation observe or miss.

## Questions

- Is time spent running, runnable, sleeping, or waiting on a resource?
- What bias and overhead does the collection method introduce?
- Can symbols and timestamps be trusted?

## Exercise

Choose evidence needed to distinguish a hot loop, lock convoy, page fault, and scheduler delay that produce the same wall-clock symptom.

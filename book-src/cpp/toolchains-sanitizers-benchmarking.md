# Toolchains, Sanitizers, and Benchmarking

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> High-Performance C++</span></p>

Debug, sanitized, profiled, and optimized binaries answer different questions.
A believable performance result records the compiler, flags, linked libraries,
hardware, operating-system state, workload, and sampling method.

## Planned model

Follow one program through warnings, AddressSanitizer, UndefinedBehaviorSanitizer,
ThreadSanitizer, optimized assembly inspection, counters, and a benchmark harness.

## Questions

- Which correctness checks are incompatible with a production-speed measurement?
- Has the optimizer removed the work or moved it outside the timed region?
- Can another person reproduce the result from the recorded environment?

## Exercise

Create a benchmark report template that distinguishes correctness evidence,
profiling evidence, and final optimized measurements.

# Performance Systems Reading Map

<p class="chapter-meta"><span><strong>Purpose</strong> Sources and laboratories</span><span><strong>Scope</strong> CPU to NIC</span></p>

This book is the curriculum and experiment notebook. It should not pretend to
replace processor manuals, kernel documentation, language standards, or the
people who developed the tools being studied.

Use four kinds of material differently:

| Kind | Use it for | Do not assume |
| --- | --- | --- |
| Foundation book | A coherent mental model and vocabulary | Every API detail is current |
| Official documentation | Current contracts, constraints, and configuration | It is a teaching sequence |
| Laboratory repository | Code to run, modify, break, and measure | Its result transfers to your machine |
| Measurement tool | Evidence about a stated experiment | The tool chooses the right question |

Pin the version or commit used in an experiment. Record the CPU, kernel, compiler,
flags, NIC, driver, firmware, topology, power policy, and relevant operating-system
configuration. “Faster” without that context is not a reusable finding.

## If you are buying books

The strongest first purchases for this curriculum are:

1. [*Systems Performance*, second edition](https://www.brendangregg.com/systems-performance-2nd-edition-book.html),
   for a disciplined whole-system method.
2. [*Understanding Software Dynamics*](https://www.informit.com/store/understanding-software-dynamics-9780137589838),
   for explaining intermittent delay, queues, waiting, and long-tail latency with
   low-overhead tracing.
3. [*The Art of Writing Efficient Programs*](https://www.packtpub.com/en-us/product/the-art-of-writing-efficient-programs-9781800208117),
   for hardware-aware measurement and optimization through C++ experiments.

Then buy according to the layer you are actively studying:

- C++ concurrency: [*C++ Concurrency in Action*, second edition](https://www.manning.com/books/c-plus-plus-concurrency-in-action-second-edition).
- Linux APIs: [*The Linux Programming Interface*](https://man7.org/tlpi/).
- Production observability: [*BPF Performance Tools*](https://www.brendangregg.com/bpf-performance-tools-book.html).
- Deep processor architecture: [*Computer Architecture: A Quantitative Approach*, seventh edition](https://www.educate.elsevier.com/book/details/9780443154065).

Two books are unusually direct about low-latency trading systems:

- [*Building Low Latency Applications with C++*](https://www.oreilly.com/library/view/building-low-latency/9781837639359/)
- [*Developing High-Frequency Trading Systems*](https://www.packtpub.com/en-CL/product/developing-high-frequency-trading-systems-9781803242811)

Use those as architecture tours and implementation prompts, not as the final
authority for processor behavior, Linux APIs, venue semantics, or benchmark
claims. They connect the layers conveniently; the specialist books and current
official documentation establish the details.

## A deliberate reading order

### 1. Learn the modern CPU cost model

Start with Denis Bakhvalov's open
[Performance Analysis and Tuning on Modern CPUs](https://github.com/dendibakh/perf-book).
Pair each concept with an exercise from
[Perf-Ninja](https://github.com/dendibakh/perf-ninja): caches, branches,
vectorization, memory-level parallelism, and hardware counters become useful only
after you predict and measure them.

Agner Fog's
[Optimizing software in C++](https://www.agner.org/optimize/optimizing_cpp.pdf)
is a dense reference for compiler behavior and low-level C++ optimization. Treat
its advice as hypotheses to verify on the compilers and processors named in your
own report.

### 2. Learn whole-system performance

Brendan Gregg's
[Systems Performance, second edition](https://www.brendangregg.com/systems-performance-2nd-edition-book.html)
provides the broader method: workloads, CPUs, memory, filesystems, networking,
profiling, tracing, and latency outliers. Its most durable lesson is to form a
system model before reaching for a favorite tool.

Use [BPF Performance Tools](https://www.brendangregg.com/bpf-performance-tools-book.html)
and its [companion repository](https://github.com/brendangregg/bpf-perf-tools-book)
when the question requires kernel visibility rather than another application
timer.

### 3. Learn Linux interfaces before bypassing them

Michael Kerrisk's
[The Linux Programming Interface](https://man7.org/tlpi/) is the comprehensive
reference. The newer open
[Linux System Programming Essentials](https://www.man7.org/training/download/Linux_System_Programming_Essentials-mkerrisk_man7.org.pdf)
is a shorter practical route through file descriptors, processes, memory, signals,
and I/O.

You should be able to explain the normal syscall, scheduler, socket-buffer, and
network-stack path before deciding which part to avoid.

### 4. Learn C++ concurrency as a correctness model

Anthony Williams's
[C++ Concurrency in Action, second edition](https://www.manning.com/books/c-plus-plus-concurrency-in-action-second-edition)
is a useful structured treatment of threads, futures, atomics, the memory model,
and lock-free structures. Pair it with current compiler and standard-library
documentation: the book targets C++17, while the implementation track here also
uses later C++ features.

The objective is not memorizing memory-order names. It is being able to state
ownership, invariants, publication edges, and reclamation rules before optimizing
a concurrent structure.

### 5. Move down the network path one layer at a time

“Kernel bypass” is not one feature, and these mechanisms are not substitutes in
every workload:

```text
ordinary sockets
    ↓ batching, affinity, busy polling, steering
io_uring: asynchronous kernel I/O through shared submission/completion rings
    ↓
XDP / AF_XDP: early packet processing plus shared user/kernel packet rings
    ↓
DPDK poll-mode drivers: userspace polling and direct NIC descriptor management
```

- The [liburing repository](https://github.com/axboe/liburing) supplies the
  reference userspace library and examples for `io_uring`. `io_uring` reduces
  submission and completion overhead; it is not general kernel bypass.
- The Linux kernel's [AF_XDP documentation](https://www.kernel.org/doc/html/latest/networking/af_xdp.html)
  defines its rings, UMEM ownership, copy modes, and socket behavior.
- [XDP Tutorial](https://github.com/xdp-project/xdp-tutorial) and
  [BPF examples](https://github.com/xdp-project/bpf-examples) are laboratories.
  Follow their own version caveats and use kernel documentation as the current
  contract.
- The [DPDK Programmer's Guide](https://doc.dpdk.org/guides/prog_guide/index.html)
  and [poll-mode driver documentation](https://doc.dpdk.org/guides/prog_guide/ethdev/ethdev.html)
  explain a substantially different ownership and operational model.
- [Seastar](https://github.com/scylladb/seastar) is a valuable C++ laboratory for
  shared-nothing, one-thread-per-core design. Its
  [tutorial](https://github.com/scylladb/seastar/blob/master/doc/tutorial.md)
  makes futures, sharding, and reactor-style execution concrete.

Do not start with DPDK because it sounds fastest. First measure ordinary sockets,
batching, queue placement, and scheduler effects. Every lower-level path trades
generality and operational simplicity for more explicit ownership and control.

### 6. Make the measurements honest

[Google Benchmark](https://github.com/google/benchmark) is a useful C++ harness,
not a substitute for experimental design. Use
[HdrHistogram_c](https://github.com/HdrHistogram/HdrHistogram_c) for wide-range
latency recording and study its coordinated-omission correction before trusting
load-test percentiles.

Final evidence should include distributions, not only averages; warm and cold
conditions when both matter; throughput at the reported latency; compiler and
binary inspection; and explicit treatment of queueing and coordinated omission.

## How the sources map to this book

| Book section | Primary companions | First laboratory |
| --- | --- | --- |
| The Machine | Bakhvalov, Perf-Ninja, Agner Fog | Predict cache and branch behavior, then check counters |
| Operating Systems | Gregg, Kerrisk, BPF tools | Attribute one latency outlier across user and kernel time |
| Concurrency | Williams, Seastar | Prove and measure a bounded SPSC channel |
| Networking and I/O | Kernel AF_XDP docs, liburing, DPDK docs | Trace buffer ownership through four receive paths |
| Performance Engineering | Gregg, Google Benchmark, HdrHistogram | Produce a reproducible latency distribution under load |
| High-Performance C++ | Agner Fog, Williams, compiler output | Compare layout, allocation, and generated code—not language slogans |

The repositories are laboratories, not a giant checklist. A good study cycle is:

1. Predict the result from a model.
2. Write the smallest experiment that could disprove the prediction.
3. Record enough environment detail to reproduce it.
4. Inspect counters, traces, or generated code when wall time cannot explain why.
5. Change one important variable and repeat.
6. Write what would make the conclusion stop being true.

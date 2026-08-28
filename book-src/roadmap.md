# Curriculum

The destination is the ability to reason about a complete low-latency system:
from the shape of an algorithm, through cache lines and scheduler behavior, to
packets, latency distributions, risk checks, and production failure modes.

This is not a survey of every computer-science topic. Material earns a place
when it helps explain, construct, or measure high-performance systems. HFT is a
later application of those foundations, not required context for learning them.

Rust is the implementation language, not the prerequisite being taught. Each
topic starts with a language-independent model and uses Rust to make ownership,
memory, concurrency, and cost concrete.

## Part I — Data structures

**Status: version 1.0 complete.**

Sequences, queues, maps, sets, trees, graphs, heaps, arenas, probabilistic
membership, rolling windows, fixed-capacity buffers, and choosing among them.

These chapters establish the vocabulary used throughout the rest of the book.

## Part II — Essential algorithms

**Status: in progress.**

- [Binary search and boundary finding](algorithms/binary-search.md)
- [Sorting, selection, and top-k problems](algorithms/sorting-selection-top-k.md)
- [Linear scans, two pointers, and sliding windows](algorithms/scans-and-windows.md)
- [Prefix aggregates and incremental computation](algorithms/prefix-and-incremental.md)
- [Graph traversal and dependency ordering](algorithms/graph-traversal.md)
- [Greedy scheduling and queueing decisions](algorithms/greedy-scheduling.md)
- [Streaming and online algorithms](algorithms/streaming-online.md)
- [Parsing and state machines](algorithms/parsing-state-machines.md)

The goal is not broad interview-problem coverage. It is to identify invariants,
prove that progress occurs, and connect asymptotic analysis with actual memory
access and data movement.

## Part III — The machine

- [Integer and floating-point representation](systems/number-representation.md)
- [Virtual memory, pages, and translation lookaside buffers](systems/virtual-memory.md)
- [Cache lines, cache hierarchy, and locality](systems/memory-hierarchy.md)
- [Branch prediction and speculative execution](systems/branch-prediction.md)
- [Data-oriented layouts](systems/data-layout.md)
- [SIMD and vectorization](systems/simd.md)
- [Allocation, fragmentation, pools, and arenas](systems/allocation.md)
- [NUMA topology and memory placement](systems/numa.md)
- [Hardware clocks and timestamp counters](systems/hardware-clocks.md)

This part explains why two programs with the same big-O complexity can have
very different latency.

## Part IV — Operating systems and execution

- [Processes, threads, privilege levels, and system calls](operating-systems/processes-threads-syscalls.md)
- [Scheduling, preemption, context switches, and jitter](operating-systems/scheduling.md)
- [CPU affinity, CPU pinning, and isolation](operating-systems/cpu-affinity.md)
- [Page faults, memory locking, and huge pages](operating-systems/page-faults.md)
- [Signals, timers, and clock sources](operating-systems/signals-timers.md)
- [Files, memory mapping, and asynchronous I/O](operating-systems/files-mmap-async-io.md)
- [Interrupts, polling, and busy waiting](operating-systems/interrupts-and-polling.md)

The objective is to understand what the operating system can do between the
start and end timestamps of an otherwise small operation.

## Part V — Concurrency

- [Threads, ownership transfer, and shared state](concurrency/threads-and-ownership.md)
- [Mutexes, reader-writer locks, and condition variables](concurrency/locks-and-conditions.md)
- [Atomics and memory ordering](concurrency/atomics-memory-ordering.md)
- [False sharing and cache coherence](concurrency/cache-coherence.md)
- [Bounded queues and backpressure](concurrency/bounded-queues.md)
- [Lock-free single-producer/single-consumer rings](concurrency/spsc-ring.md)
- [Multi-producer algorithms and contention](concurrency/multi-producer.md)
- [Read-copy-update, epochs, and reclamation](concurrency/reclamation.md)
- [Async runtimes versus dedicated threads](concurrency/async-vs-threads.md)

Correctness comes first; predictability and throughput follow from measuring
the resulting contention and coordination.

## Part VI — Networking and I/O

- [Ethernet, IP, UDP, TCP, and multicast](networking/network-stack.md)
- [Socket buffers, batching, and packet timestamps](networking/socket-buffers.md)
- [NIC queues, receive-side scaling, and flow steering](networking/nic-queues.md)
- [Interrupt moderation and busy polling](networking/interrupt-moderation.md)
- [Zero-copy techniques](networking/zero-copy.md)
- [`io_uring`, AF_XDP, and kernel-bypass architectures](networking/io-uring-af-xdp.md)
- [DPDK-style poll-mode processing](networking/dpdk.md)
- [Protocol parsing and sequence recovery](networking/protocol-parsing.md)

The emphasis is the complete path from a byte on the wire to application state,
including where copies, queues, interrupts, and scheduling enter that path.

## Part VII — Latency measurement and performance engineering

- [Throughput versus latency](performance/throughput-vs-latency.md)
- [Latency distributions, percentiles, and tail behavior](performance/latency-distributions.md)
- [Histograms and coordinated omission](performance/histograms.md)
- [Warm-up, cache state, and benchmark design](performance/benchmark-design.md)
- [Profiling CPU, allocation, locks, and I/O](performance/profiling.md)
- [Jitter budgets and critical-path analysis](performance/jitter-budgets.md)
- [Load generation, replay, and deterministic tests](performance/load-replay.md)
- [Capacity, overload behavior, and graceful degradation](performance/overload.md)

Averages are rarely enough. This part teaches how to produce measurements that
remain meaningful when the system is busy or occasionally slow.

## Part VIII — Storage and database internals

- [Pages, B-trees, log-structured storage, and write-ahead logs](storage/storage-engines.md)
- [Buffer pools and caching](storage/buffer-pools.md)
- [Transactions, isolation, and recovery](storage/transactions.md)
- [Columnar layouts, compression, and vectorized execution](storage/columnar.md)
- [Time-series storage and append-only logs](storage/time-series.md)
- [Index design and query execution](storage/indexes-and-queries.md)

Storage systems provide durable examples of the same locality, batching,
contention, and recovery tradeoffs found in trading infrastructure.

## Part IX — Market and trading systems

- [Market data, feeds, sequence numbers, and gap recovery](trading/market-data.md)
- [Limit order books and price-time priority](trading/order-books.md)
- [Matching engines and deterministic replay](trading/matching-engines.md)
- [Order gateways, acknowledgements, and state machines](trading/order-gateways.md)
- [Pre-trade risk checks and kill switches](trading/risk-checks.md)
- [Position, P&L, and exposure tracking](trading/position-and-pnl.md)
- [Simulation, backtesting, and avoiding look-ahead bias](trading/backtesting.md)
- [Clock synchronization and latency attribution](trading/clock-synchronization.md)
- [Failure recovery and operational controls](trading/failure-recovery.md)

Finance appears here as an application of the earlier foundations rather than a
collection of unexplained low-latency tricks.

## Chapter rule

A topic graduates into the book only when it has a concrete motivating problem,
an interactive model where motion clarifies the idea, a predictive invariant,
a straightforward Rust implementation, honest alternatives, sharp edges, and a
focused exercise.

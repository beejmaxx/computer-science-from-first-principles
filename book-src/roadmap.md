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

- Binary search and boundary finding
- Sorting, selection, and top-k problems
- Linear scans, two pointers, and sliding windows
- Prefix aggregates and incremental computation
- BFS, shortest paths, and dependency ordering where systems need them
- Greedy scheduling and queueing decisions
- Streaming and online algorithms
- Parsing and state machines for data feeds and protocols

The goal is not broad interview-problem coverage. It is to identify invariants,
prove that progress occurs, and connect asymptotic analysis with actual memory
access and data movement.

## Part III — The machine

- Integer and floating-point representation
- Virtual memory, pages, and translation lookaside buffers
- Cache lines, cache hierarchy, and locality
- Branch prediction and speculative execution
- SIMD and data-oriented layouts
- Allocation, fragmentation, pools, and arenas
- NUMA topology and memory placement
- Hardware clocks and timestamp counters

This part explains why two programs with the same big-O complexity can have
very different latency.

## Part IV — Operating systems and execution

- Processes, threads, privilege levels, and system calls
- Scheduling, preemption, context switches, and jitter
- CPU affinity, CPU pinning, and isolation
- Page faults, memory locking, and huge pages
- Signals, timers, and clock sources
- Files, memory mapping, and asynchronous I/O
- Interrupts, polling, and busy waiting

The objective is to understand what the operating system can do between the
start and end timestamps of an otherwise small operation.

## Part V — Concurrency

- Threads, ownership transfer, and shared state
- Mutexes, reader-writer locks, and condition variables
- Atomics and memory ordering
- False sharing and cache coherence
- Bounded queues and backpressure
- Lock-free single-producer/single-consumer rings
- Multi-producer algorithms and contention
- Read-copy-update, epochs, and reclamation
- Async runtimes versus dedicated threads

Correctness comes first; predictability and throughput follow from measuring
the resulting contention and coordination.

## Part VI — Networking and I/O

- Ethernet, IP, UDP, TCP, and multicast
- Socket buffers, batching, and packet timestamps
- NIC queues, receive-side scaling, and flow steering
- Interrupt moderation and busy polling
- Zero-copy techniques
- `io_uring`, AF_XDP, and kernel-bypass architectures
- DPDK-style poll-mode processing
- Protocol parsing and sequence recovery

The emphasis is the complete path from a byte on the wire to application state,
including where copies, queues, interrupts, and scheduling enter that path.

## Part VII — Latency measurement and performance engineering

- Throughput versus latency
- Latency distributions, percentiles, and tail behavior
- Histograms and coordinated omission
- Warm-up, cache state, and benchmark design
- Profiling CPU, allocation, locks, and I/O
- Jitter budgets and critical-path analysis
- Load generation, replay, and deterministic tests
- Capacity, overload behavior, and graceful degradation

Averages are rarely enough. This part teaches how to produce measurements that
remain meaningful when the system is busy or occasionally slow.

## Part VIII — Storage and database internals

- Pages, B-trees, log-structured storage, and write-ahead logs
- Buffer pools and caching
- Transactions, isolation, and recovery
- Columnar layouts, compression, and vectorized execution
- Time-series storage and append-only logs
- Index design and query execution

Storage systems provide durable examples of the same locality, batching,
contention, and recovery tradeoffs found in trading infrastructure.

## Part IX — Market and trading systems

- Market data, feeds, sequence numbers, and gap recovery
- Limit order books and price-time priority
- Matching engines and deterministic replay
- Order gateways, acknowledgements, and state machines
- Pre-trade risk checks and kill switches
- Position, P&L, and exposure tracking
- Simulation, backtesting, and avoiding look-ahead bias
- Clock synchronization and latency attribution
- Failure recovery and operational controls

Finance appears here as an application of the earlier foundations rather than a
collection of unexplained low-latency tricks.

## Chapter rule

A topic graduates into the book only when it has a concrete motivating problem,
an interactive model where motion clarifies the idea, a predictive invariant,
a straightforward Rust implementation, honest alternatives, sharp edges, and a
focused exercise.

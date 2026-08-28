# LMAX Disruptor — A Sequence-Gated Event Pipeline

<p class="chapter-subtitle">A preallocated ring stores events; monotonically increasing sequences coordinate producers, consumers, dependencies, and backpressure.</p>

<p class="chapter-meta"><span><strong>Section</strong> Concurrency</span><span><strong>Model</strong> Multicast pipeline</span><span><strong>Goal</strong> Separate storage from coordination</span></p>

<div class="disruptor-demo" data-disruptor-demo></div>

Use the controls to publish events and advance the three consumers. The journal
and replication stages may run in parallel. The engine may process sequence `n`
only after both upstream stages have processed `n`. When the engine falls a full
ring behind, the producer must stop rather than overwrite live data.

That yields the central model:

~~~text
preallocated slots + monotonic sequences + dependency barriers + gating
    = a bounded, multicast event pipeline
~~~

The Disruptor is not merely a fast circular queue. Its important contribution is
the separation of event storage, sequence allocation, publication, consumer
progress, dependency graphs, and waiting policy.

## Why ordinary queue language is misleading

In a work queue, one item is normally removed by one worker. In a typical
Disruptor graph, every independent consumer sees every published event:

~~~text
producer
   ├── journal ──┐
   └── replicate ├── engine
                 ┘
~~~

The journal and replication handlers both observe sequence `42`. The engine's
barrier waits until both have reached at least `42`, then the engine observes the
same ring slot. Nothing is copied into three ordinary queues.

The dependency graph can express parallel stages, pipelines, and joins. It does
not automatically mean that several consumers divide the work between them.

## The ring stores reusable event objects

The ring has a fixed capacity, normally a power of two. Slots are allocated in
advance and reused:

~~~text
physical_index = sequence & (capacity - 1)
~~~

Sequence numbers keep increasing across wraparound. Physical slot `2` might hold
sequence `2`, later sequence `10`, and later sequence `18` in an eight-slot ring.
The sequence identifies the logical event; the masked index identifies reusable
storage.

Preallocation can reduce allocation and garbage-collection pressure, but reuse
creates a strict rule:

> A producer must never wrap onto a slot that any gating consumer can still read.

That rule is the source of bounded backpressure.

## Claim, write, then publish

A producer conceptually performs three distinct actions:

~~~text
sequence = claim_next()
write event into ring[sequence & mask]
publish(sequence)
~~~

Publication is the handoff. Consumers must not observe a claimed slot before its
event is completely initialized. The actual Java implementation uses carefully
designed sequence operations and memory-ordering guarantees; a translation to C++
or Rust must recreate the happens-before relationship rather than copy surface
syntax.

The visualization combines claim, write, and publish into one button so that the
storage and gating rules remain visible. A multi-producer sequencer has additional
work: producers may claim different sequences concurrently, so publication must
not expose an unpublished hole as available data.

## Consumers own progress sequences

Each event processor owns a sequence recording the highest contiguous event it
has completed:

~~~text
published = 12
journal   = 12
replicate = 10
engine    = 10
~~~

The journal can continue to `12`, but the engine's dependency barrier exposes only:

~~~text
available_to_engine = min(journal, replicate) = 10
~~~

The engine cannot process `11` until replication reaches it. This is coordination
through progress counters rather than moving event ownership between linked queue
nodes.

## Gating prevents destructive wraparound

For a ring of capacity `C`, a producer considering sequence `S` computes:

~~~text
wrap_point = S - C
~~~

If the wrap point is greater than the minimum gating sequence, publishing `S`
would overwrite a slot still needed downstream. The producer must wait, reject,
or apply a surrounding overload policy.

In the chapter's graph, the engine is the final consumer and therefore gates
reuse. The journal and replication stages constrain the engine; the engine in turn
constrains the producer.

This makes the system bounded, but it does not decide what the application should
do when full. A real system must choose deliberately among backpressure, bounded
waiting, shedding, disconnecting, or failure.

## Sequence barriers encode dependencies

A consumer asks a sequence barrier whether its next sequence is available. The
barrier considers both the producer cursor and any upstream consumer sequences.

Conceptually:

~~~text
next = my_sequence + 1
available = min(published_cursor, dependencies...)

if next <= available:
    process a contiguous batch
else:
    apply the configured wait strategy
~~~

The official API separates the `Sequencer`, `Sequence`, `SequenceBarrier`, event
processor, handler, and wait strategy. That separation is the architecture, not
incidental library vocabulary.

## Batching emerges naturally

If a consumer wakes for sequence `40` and discovers that sequences through `57`
are available, it can process the entire contiguous range:

~~~text
for sequence in 40..=57 {
    handle(ring[sequence & mask]);
}
consumer_sequence = 57;
~~~

This amortizes barrier checks and can improve instruction and data locality.
Batching also changes latency behavior: throughput may improve while an individual
event waits behind earlier work. Report both throughput and a latency distribution.

## Wait strategies exchange CPU for wake-up behavior

Waiting is policy, not an intrinsic ring-buffer operation:

| Strategy | Idle behavior | Typical tradeoff |
| --- | --- | --- |
| Blocking | Park using a lock and condition | Conserves CPU; scheduler wake-up can add latency and jitter |
| Sleeping/backoff | Spin, yield, then park briefly | Middle ground; more latency than dedicated spinning |
| Yielding | Spin and yield | Burns CPU but lets other runnable threads progress |
| Busy spin | Continuously poll a sequence | Lowest wake-up machinery; requires a dedicated, correctly placed core |

Busy spinning is not free speed. On an oversubscribed host it can steal execution
time from the producer or the consumer it is waiting for. CPU affinity, sibling
hyperthreads, NUMA placement, power management, and deployment isolation become
part of the design.

## Cache lines still matter

The coordination variables are written frequently by different threads. If two
independent sequences occupy one cache line, otherwise unrelated writers can
bounce that line between cores. The Disruptor's `Sequence` includes measures to
avoid false sharing.

Padding is not a magic annotation. Verify object layout, alignment, and generated
code for the actual runtime. Also remember that event fields written by different
parallel handlers can false-share even when their sequence counters do not.

## Single producer and multiple producers are different algorithms

A single producer owns sequence allocation and can advance it without contending
with another publisher. A multi-producer sequencer must coordinate claims and
track which claimed sequences have actually been published.

Choose the single-producer mode when the architecture guarantees it. Do not select
multi-producer mode “for flexibility” without measuring the coordination it adds.
Likewise, do not serialize several natural producers merely to satisfy a benchmark.
The topology should follow the real ownership model.

## What the Disruptor does not solve

It does not provide:

- Unbounded buffering.
- Durability merely because a journal consumer exists.
- Network transport.
- Automatic load shedding or overload policy.
- General work stealing.
- A portable promise of a particular nanosecond latency.
- Freedom from memory-ordering and lifecycle proofs.
- Faster behavior for every workload than every ordinary bounded queue.

It is most compelling when a bounded stream is multicast through stable stages,
events can be preallocated, dependency order is explicit, and cores may be
dedicated. An ordinary channel or bounded queue is often better when traffic is
light, blocking is desirable, consumer topology is simple, or operational
simplicity matters more than removing coordination overhead.

## Relationship to the LMAX architecture

LMAX used Disruptors around a single-threaded business-logic processor. The
single writer made domain-state transitions deterministic; surrounding stages
handled activities such as input, journaling, replication, and output concurrently.

These are related ideas, but not identical:

- **Disruptor:** a library and pattern for sequence-coordinated event pipelines.
- **Single-writer state machine:** an ownership architecture for mutable domain state.
- **Event sourcing:** reconstructing state from an authoritative event history.

A system can use any one without adopting all three.

## What to measure

Compare the Disruptor design with the simplest correct bounded queue for the actual
workload. Record:

- Single-event latency and full distributions under sustained load.
- Throughput at the reported tail-latency target.
- Batch sizes and burst behavior.
- Time spent waiting because the ring is full.
- CPU utilization per core, not only process-wide utilization.
- Context switches, migrations, cache misses, and coherence traffic.
- Effects of core placement and simultaneous multithreading.
- Recovery behavior after a consumer stalls or fails.

A benchmark that keeps consumers perfectly balanced does not test the gating rule
that protects the system under stress.

## What you should internalize

1. The ring owns reusable storage; sequences coordinate access to it.
2. Logical sequences increase monotonically even though physical slots wrap.
3. A producer must write before publishing.
4. Consumers track independent progress and usually see every event.
5. Barriers express pipeline dependencies and joins.
6. The slowest required downstream sequence ultimately gates slot reuse.
7. Gating creates bounded backpressure instead of permitting overwrite.
8. Batching, wait policy, core placement, and cache lines affect observed latency.
9. Single- and multi-producer sequencing require different coordination.
10. The Disruptor is useful only when its topology matches the workload.

## Retrieval drill

For capacity `8`, suppose the producer has published through sequence `14`, the
journal is at `14`, replication is at `12`, and the engine is at `12`:

1. What sequence does the engine want next, and is it available yet?
2. Which physical slot contains sequence `14`?
3. Can the producer safely publish sequence `21`? What about `22`?
4. Which sequence must move before the producer can reuse the blocked slot?
5. Would adding another busy-spinning consumer necessarily reduce latency?

## Sources

- [Official LMAX Disruptor user guide](https://lmax-exchange.github.io/disruptor/user-guide/)
- [LMAX Disruptor technical paper](https://lmax-exchange.github.io/disruptor/files/Disruptor-1.0.pdf)
- [Official source repository](https://github.com/LMAX-Exchange/disruptor)
- Martin Fowler, [The LMAX Architecture](https://martinfowler.com/articles/lmax.html)

The named classes and current library behavior are Java-specific. The sequence,
publication, dependency, gating, and measurement models apply more broadly, but a
C++ or Rust implementation needs its own memory-model and lifetime argument.

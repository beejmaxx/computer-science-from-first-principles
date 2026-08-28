# Hardware Clocks and Timestamp Counters

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> The Machine</span></p>

Measuring short intervals requires knowing what a clock counts, whether cores agree, how reads are ordered, and how ticks become time.

## Planned model

Compare a timestamp counter, monotonic OS clock, and wall clock while injecting frequency conversion, read overhead, migration, drift, and clock adjustment.

## Questions

- What distinguishes monotonic time from civil time?
- When must instruction execution be ordered around a timestamp read?
- How should clock overhead and resolution be measured?

## Exercise

Design a microbenchmark timer that reports its own read overhead and rejects samples affected by migration or preemption.

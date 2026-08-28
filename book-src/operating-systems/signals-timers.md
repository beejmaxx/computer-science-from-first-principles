# Signals, Timers, and Clock Sources

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Operating Systems and Execution</span></p>

Signals and timers inject asynchronous events into otherwise sequential execution. Clock choice determines whether elapsed-time and deadline calculations remain meaningful.

## Planned model

Schedule timers against monotonic and realtime clocks while introducing signal delivery delay, coalescing, interruption, drift, and wall-clock adjustment.

## Questions

- Which work is safe inside a signal handler?
- How do timer resolution and delivery latency differ?
- Why should deadlines normally use monotonic time?

## Exercise

Design a periodic task that handles overruns without silently drifting later on every cycle.

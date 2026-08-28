# Scheduling, Preemption, and Jitter

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Operating Systems and Execution</span></p>

The scheduler multiplexes runnable work onto CPUs. Preemption makes progress fairer, but adds delay that application code does not directly control.

## Planned model

Run tasks under round-robin, priority, and isolated-core scenarios. Display run queues, time slices, migrations, wake-ups, and the latency distribution of one critical task.

## Questions

- What makes a runnable thread wait?
- How do priority and affinity change latency without eliminating interrupts?
- Why does low average utilization not guarantee immediate scheduling?

## Exercise

Explain a one-millisecond outlier in a ten-microsecond operation using a scheduling timeline and the evidence needed to confirm it.

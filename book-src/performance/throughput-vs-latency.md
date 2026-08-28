# Throughput Versus Latency

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Performance Engineering</span></p>

Throughput counts completed work per unit time; latency measures how long individual work waits and executes. Optimizing one can damage the other.

## Planned model

Adjust arrival rate, service rate, batching, and parallelism. Plot throughput, utilization, queue depth, and latency together.

## Questions

- When does a system saturate?
- Why does queueing delay rise sharply near capacity?
- Which latency is measured: service time, queue time, or end-to-end time?

## Exercise

Explain why doubling batch size can increase throughput while violating the latency objective.

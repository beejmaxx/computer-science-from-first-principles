# Capacity, Overload, and Graceful Degradation

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Performance Engineering</span></p>

When arrivals exceed sustainable service, work must queue, be delayed, be rejected, or displace other work. Unbounded buffering only postpones the decision.

## Planned model

Drive a pipeline beyond capacity under blocking, dropping, prioritization, admission control, and load-shedding policies. Plot recovery after the burst ends.

## Questions

- What is the true bottleneck and sustainable rate?
- Which work may be discarded safely?
- Can the system recover promptly, or does stale backlog prolong failure?

## Exercise

Define overload behavior for every bounded resource in a pipeline and prove that memory use remains bounded.

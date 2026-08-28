# Histograms and Coordinated Omission

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Performance Engineering</span></p>

Histograms approximate distributions through buckets. A load generator that waits for a delayed response before scheduling more work can omit the delay's consequences.

## Planned model

Compare closed-loop and open-loop load generation through an injected stall. Display intended arrivals, actual requests, omitted samples, and resulting histograms.

## Questions

- What precision and range do histogram buckets provide?
- Why does a closed loop under-sample periods of poor service?
- What correction is possible, and what assumptions does it make?

## Exercise

Design a latency test whose request schedule remains independent of the system's response latency.

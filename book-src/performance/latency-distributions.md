# Latency Distributions and Tail Behavior

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Performance Engineering</span></p>

A mean compresses a distribution into one number and can hide the rare delays that define user-visible or deadline-sensitive behavior.

## Planned model

Generate mixtures of fast and slow paths. Compare mean, median, percentiles, maximum, histogram, and survival curve as rare events change.

## Questions

- What population and time interval does a percentile summarize?
- How many samples support a claimed high percentile?
- How do correlated pauses affect end-to-end tail latency?

## Exercise

Interpret two systems with equal means but different p99 and p99.99 behavior, then choose one for a stated deadline.

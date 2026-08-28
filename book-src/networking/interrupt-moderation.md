# Interrupt Moderation and Busy Polling

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Networking and I/O</span></p>

NIC interrupt moderation waits for more packets before notifying the CPU. Busy polling looks for them proactively. Both trade CPU consumption for batching and response time.

## Planned model

Deliver adjustable packet bursts under immediate interrupts, coalescing, adaptive moderation, and busy polling. Plot notification count and latency distribution.

## Questions

- What does a coalescing timer delay?
- How does packet rate change the best policy?
- Which CPU performs the poll and what else can run there?

## Exercise

Choose an interrupt and polling policy for quiet periods punctuated by high-value bursts.

# Bounded Queues and Backpressure

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Concurrency</span></p>

A bounded queue makes overload visible. Its capacity and full-queue policy determine memory use, delay, loss, and how pressure propagates upstream.

## Planned model

Vary producer and consumer rates while plotting occupancy, queueing delay, dropped work, blocked producers, and batch size.

## Questions

- Does a full queue block, reject, overwrite, or shed lower-value work?
- How does capacity affect burst tolerance and worst-case residence time?
- Where should backpressure terminate?

## Exercise

Choose a capacity and overload policy for a pipeline with a stated burst size and latency budget.

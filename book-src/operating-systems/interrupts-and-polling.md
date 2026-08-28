# Interrupts, Polling, and Busy Waiting

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Operating Systems and Execution</span></p>

Interrupts save CPU time while idle; polling spends CPU time to detect work with less wake-up machinery. Hybrid designs occupy the space between them.

## Planned model

Deliver events under interrupt, periodic polling, busy waiting, and adaptive spinning. Plot CPU consumption beside typical and tail response time.

## Questions

- At what event rate does polling become attractive?
- How do interrupt moderation and batching interact?
- When should a spin loop yield or sleep?

## Exercise

Choose a wait strategy for a bursty queue and justify the transition points between spinning, yielding, and blocking.

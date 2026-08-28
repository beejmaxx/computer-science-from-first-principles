# Clock Synchronization and Latency Attribution

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Market and Trading Systems</span></p>

Latency attribution across hosts requires clocks with known offset, drift, precision, and timestamp location. A precise timestamp can still be inaccurate.

## Planned model

Send events across clocks with drift and offset, then apply software, hardware, NTP-style, and PTP-style synchronization. Show attribution error at each stage.

## Questions

- Where in the packet path was a timestamp taken?
- How is clock error bounded rather than merely estimated once?
- Which intervals can be measured safely on one clock?

## Exercise

Create an error budget for one-way latency measured across two hosts and identify what independent evidence validates it.

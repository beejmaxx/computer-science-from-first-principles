# NIC Queues, RSS, and Flow Steering

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Networking and I/O</span></p>

Modern NICs expose multiple queues so packet processing can be distributed, but queue, interrupt, CPU, and application ownership must align.

## Planned model

Hash flows into receive queues and steer queues to CPUs. Display reordering risks, hot flows, interrupt affinity, cache locality, and NUMA placement.

## Questions

- Which packet fields feed the receive-side scaling hash?
- How can one heavy flow dominate a queue?
- Where should queue memory and its consumer thread reside?

## Exercise

Map eight receive queues to a two-socket CPU topology and explain how application flow ownership follows the mapping.

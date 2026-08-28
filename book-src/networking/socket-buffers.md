# Socket Buffers, Batching, and Packet Timestamps

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Networking and I/O</span></p>

Socket queues absorb bursts and decouple producers from consumers, but every queued packet acquires residence time and can eventually be dropped.

## Planned model

Move packets through NIC and socket queues while adjusting buffer sizes, application batch size, and timestamp location. Plot drops, syscalls, and latency.

## Questions

- Which queue does a socket-buffer setting actually change?
- When does batching improve throughput but harm first-packet latency?
- What event does each software or hardware timestamp represent?

## Exercise

Select buffer and batch policies for a bursty receiver with a strict stale-data deadline.

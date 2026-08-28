# Protocol Parsing and Sequence Recovery

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Networking and I/O</span></p>

A fast parser is useless if it silently accepts corrupt frames or advances application state across missing sequence numbers.

## Planned model

Deliver fragmented, duplicated, reordered, missing, and malformed messages. Track framing state, expected sequence, gap detection, buffering, recovery, and resumption.

## Questions

- Which validation occurs before any state mutation?
- How are duplicates and gaps distinguished?
- When should live processing pause, buffer, or continue provisionally?

## Exercise

Specify a feed-state machine from startup through synchronization, normal processing, gap recovery, and unrecoverable failure.

# Parsing and State Machines

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Essential Algorithms</span></p>

Protocol parsers turn bytes into state transitions while preserving framing, validation, and recovery invariants.

## Planned model

Step through a fragmented byte stream. Display parser state, buffered bytes, completed messages, rejected input, and resynchronization points.

## Questions

- How is a complete frame recognized across arbitrary chunk boundaries?
- Which lengths and offsets must be validated before slicing?
- Can parsing proceed without copying the payload?

## Exercise

Implement an incremental length-prefixed parser that accepts partial frames and rejects oversized messages.

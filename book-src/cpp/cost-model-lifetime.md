# Cost Model and Object Lifetime

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> High-Performance C++</span></p>

C++ performance starts with knowing when an object is constructed, moved,
copied, destroyed, or never materialized at all. RAII gives lifetime a local
shape, but hidden temporaries and ownership mistakes can still dominate a hot
path.

## Planned model

Trace one value through construction, return-value optimization, move, container
growth, and destruction. Inspect counters and generated code instead of guessing
from source syntax.

## Questions

- Which operations are guaranteed, permitted to disappear, or implementation-dependent?
- When is a move still expensive?
- How do lifetime and ownership choices affect tail latency and failure safety?

## Exercise

Instrument a small message type, then explain every construction and destruction
observed when it enters and leaves a growing container.

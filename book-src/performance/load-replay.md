# Load Generation, Replay, and Deterministic Tests

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Performance Engineering</span></p>

Useful load reproduces arrival timing, data shape, dependencies, and bursts without letting the system under test secretly pace its generator.

## Planned model

Replay one trace in wall-clock, accelerated, closed-loop, and deterministic-step modes. Show scheduling error, backlog, nondeterminism, and state divergence.

## Questions

- Which properties of production traffic must the generator preserve?
- How are randomness and time controlled for repeatability?
- Can replay overload be distinguished from generator overload?

## Exercise

Design a deterministic replay format containing enough information to reproduce both inputs and relevant timing decisions.

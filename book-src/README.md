# Computer Science from First Principles

<p class="chapter-subtitle">Interactive foundations for high-performance, low-latency systems.</p>

<p class="chapter-meta"><span><strong>Data structures</strong> Version 1.0</span><span><strong>Current part</strong> Algorithms</span></p>

Low latency is not one trick. It emerges from choices made across algorithms,
memory layout, scheduling, synchronization, networking, measurement, and the
application itself.

This book builds those ideas from the ground up. Each chapter begins with a
concrete problem and an interactive model, establishes a language-independent
invariant, and then uses straightforward Rust to make the costs explicit. It
assumes you can read basic Rust without making Rust syntax the subject.

Every field note answers the same questions:

- What problem does this idea solve?
- What is the smallest complete example?
- What mental model predicts its behavior?
- Which costs become visible on real machines?
- When should you choose something else?

Start with [`VecDeque`](vecdeque.md) when work must enter and leave a collection
in order, continue to [binary search](algorithms/binary-search.md) to see how an
invariant becomes an algorithm, or browse the [curriculum](roadmap.md) to see
the path toward complete low-latency systems.

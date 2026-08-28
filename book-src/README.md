# Data Structures in Rust

<p class="chapter-subtitle">An interactive guide from first principles.</p>

<p class="chapter-meta"><span><strong>Version</strong> 1.0</span><span><strong>Status</strong> Foundational guide complete</span></p>

Data structures are choices about what must be fast, what may be slower, and
how values should be arranged in memory.

Each chapter introduces one structure through a concrete problem, an
interactive model, and runnable Rust. It assumes you can read basic Rust, but
it does not make you revisit the language from the beginning. Chapters stand
alone and can be read in any order.

Every field note answers the same questions:

- What problem does this structure solve?
- What is the smallest complete example?
- What mental model predicts its behavior?
- Which details matter in real programs?
- When should you choose something else?

Start with [`VecDeque`](vecdeque.md) when work must enter and leave a collection
in order, or browse the [selection guide](selection-guide.md) when you need to
choose among several structures.

# Computer Science from First Principles

Interactive foundations for high-performance, low-latency systems, with
practical Rust and modern C++ implementations.

**Status:** In development. The data-structures part reached version 1.0.

The book builds from data structures and algorithms into the machine, operating
system, concurrency, networking, performance, storage, and market-system ideas
needed to reason about low-latency software. Chapters emphasize interactive
models, predictive invariants, honest costs, and measured implementations.

Read it online at
**https://beejmaxx.github.io/computer-science-from-first-principles/**.

## Read locally

Install [mdBook](https://rust-lang.github.io/mdBook/), then run:

```sh
mdbook serve --open
```

## Validate the book

```sh
mdbook test
mdbook build
```

## Structure

- `book-src/SUMMARY.md` controls the sidebar.
- Chapters remain self-contained and are grouped into progressively deeper
  parts.
- `book-src/roadmap.md` records the full curriculum and its low-latency purpose.

Start with [`VecDeque`](book-src/vecdeque.md), begin the algorithms part with
[`Binary Search`](book-src/algorithms/binary-search.md), or choose a topic from
the [curriculum](book-src/roadmap.md).

## Contributing

Corrections, clearer explanations, and focused interactive examples are
welcome through issues and pull requests.

## License

Computer Science from First Principles is available under the
[MIT License](LICENSE).

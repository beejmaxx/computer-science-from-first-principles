# Rust Toolbox

Rust Toolbox is a collection of independent, practical field notes on useful
Rust types and APIs. Open the book at the problem you have; there is no required
reading order.

The book assumes you can read ordinary Rust. It focuses on what a tool is for,
how it behaves, where it surprises people, and what to choose instead when it
is the wrong fit.

Read it online at **https://beejmaxx.github.io/rust-toolbox/**.

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
- Each tool gets a self-contained chapter under `book-src/`.
- `book-src/roadmap.md` holds candidate topics without imposing a curriculum.

The first complete field note is [`VecDeque`](book-src/vecdeque.md).

## Contributing

Corrections, clearer explanations, and focused interactive examples are
welcome through issues and pull requests.

## License

Rust Toolbox is available under the [MIT License](LICENSE).

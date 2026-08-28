# Data Structures in Rust

An interactive guide to data structures from first principles.

The book assumes you can read ordinary Rust. It focuses on how each structure
works, when to use it, where it surprises people, and what to choose instead
when it is the wrong fit. Chapters stand alone and can be read in any order.

Read it online at **https://beejmaxx.github.io/data-structures-in-rust/**.

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
- Each data structure gets a self-contained chapter under `book-src/`.
- `book-src/roadmap.md` holds candidate topics without imposing a curriculum.

Start with [`VecDeque`](book-src/vecdeque.md), or choose a structure directly
from the book's sidebar.

## Contributing

Corrections, clearer explanations, and focused interactive examples are
welcome through issues and pull requests.

## License

Data Structures in Rust is available under the [MIT License](LICENSE).

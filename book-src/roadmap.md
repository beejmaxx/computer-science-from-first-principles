# Roadmap

Rust Toolbox grows one independent field note at a time. This is a pool of
useful next topics, not a required reading order.

The foundational data-structure curriculum is now represented in the book.

## Collections

- `SmallVec` and `ArrayVec`: when inline capacity is worth the tradeoff

## Values and initialization

- `Cow`: borrow until mutation is necessary
- `OnceLock` and `LazyLock`: initialize shared values once
- `NonZero<T>`: give zero a meaning the type system can see
- `mem::take` and `mem::replace`: move values through borrowed structures

## Time, paths, and text

- `Duration` and `Instant`: measure time without wall-clock mistakes
- `Path` and `PathBuf`: filesystem paths are not strings
- `OsStr` and `OsString`: preserve operating-system text
- `CString` and `CStr`: cross a C boundary deliberately

## Coordination

- `mpsc` channels: ownership transfer between threads
- `Barrier`: advance a group in phases
- `Condvar`: sleep until shared state changes
- atomics: counters, flags, and memory-ordering boundaries

## Chapter rule

A topic graduates from this list when it has a concrete motivating problem, a
complete runnable example, a predictive mental model, honest alternatives, and
sharp edges worth remembering.

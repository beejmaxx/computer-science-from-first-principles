# 4. `Vec` — A Growable Array

`Vec<T>` stores values in a growable contiguous allocation. It is Rust's
default general-purpose sequence and the collection to try first when values
are primarily added and removed at the back.

<div class="ds-demo" data-demo="vec"></div>

## When to use `Vec`

Use `Vec` when:

- You need fast indexing by position.
- You append values and iterate over them.
- You use the collection as a stack.
- You sort, search, or pass the contents as a slice.
- Dense storage and cache locality matter.

The decision rule is:

> Start with `Vec` for an ordered sequence; switch only when another access
> pattern clearly dominates.

Use `VecDeque` when front removal is routine, a map when lookup is by key, and
`BinaryHeap` when removal is by priority.

## 1. The essential mental model

A vector tracks three pieces of state:

```text
pointer   address of the allocation
length    number of initialized elements
capacity  number of elements that fit before growth
```

```text
allocation: [ A | B | C | unused | unused ]
length:       3
capacity:     5
```

Elements occupy the first `length` slots contiguously. The unused capacity does
not contain initialized `T` values.

## 2. The basic API

```rust
fn main() {
    let mut values = Vec::new();

    values.push(10);
    values.push(20);
    values.push(30);

    assert_eq!(values.first(), Some(&10));
    assert_eq!(values.last(), Some(&30));
    assert_eq!(values.get(1), Some(&20));
    assert_eq!(values[1], 20);

    assert_eq!(values.pop(), Some(30));
    assert_eq!(values, vec![10, 20]);
}
```

Indexing panics when the index is out of bounds. `get` returns `Option<&T>` and
is appropriate when absence is possible.

## 3. Growth and capacity

When `len == capacity`, a push may allocate a larger region and move every
element into it. This invalidates pointers into the old allocation.

```rust
fn main() {
    let mut samples = Vec::with_capacity(1_000);
    assert!(samples.capacity() >= 1_000);
    assert_eq!(samples.len(), 0);

    samples.extend(0..1_000);
    assert_eq!(samples.len(), 1_000);
}
```

Reserve when a useful size estimate is known. Do not reserve enormous capacity
without evidence; unused capacity still consumes memory.

## 4. `Vec` as a stack

The back of a vector provides last-in, first-out behavior:

```rust
fn main() {
    let mut stack = Vec::new();
    stack.push("first");
    stack.push("second");

    assert_eq!(stack.pop(), Some("second"));
    assert_eq!(stack.pop(), Some("first"));
}
```

Rust needs no separate standard-library stack type because `Vec` already has
the right operations and representation.

## 5. Slices are borrowed views

A slice, `&[T]`, borrows a contiguous region without owning its allocation:

```rust
fn sum(values: &[i32]) -> i32 {
    values.iter().sum()
}

fn main() {
    let values = vec![10, 20, 30, 40];
    assert_eq!(sum(&values), 100);
    assert_eq!(sum(&values[1..3]), 50);
}
```

Accepting a slice instead of `&Vec<T>` makes a function work with vectors,
arrays, and subranges.

## 6. Complexity

| Operation | Complexity |
|---|---:|
| Index, `first`, `last` | `O(1)` |
| `push`, `pop` at back | amortized `O(1)` |
| Insert or remove at index `i` | `O(n - i)` |
| Search by value | `O(n)` |
| Iteration | `O(n)` |
| Sort | `O(n log n)` |

Removing index zero shifts every later element. Repeating `remove(0)` to drain
a queue can become `O(n²)`; use `VecDeque::pop_front` instead.

## 7. Useful transformations

```rust
fn main() {
    let mut values = vec![4, 1, 4, 2, 3, 2];

    values.sort();
    values.dedup();
    values.retain(|value| value % 2 == 0);

    assert_eq!(values, vec![2, 4]);
}
```

`sort` establishes order, `dedup` removes adjacent duplicates, and `retain`
keeps values matching a predicate.

## 8. What you should internalize

1. `Vec` is a growable contiguous array.
2. Length counts live values; capacity counts available slots.
3. Indexing and back operations are cheap.
4. Middle and front changes shift elements.
5. Slices expose borrowed contiguous views.
6. `Vec` is the default ordered collection and the standard stack.

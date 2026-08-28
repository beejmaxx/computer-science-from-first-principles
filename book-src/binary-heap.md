# 3. `BinaryHeap` — A Priority Queue

A priority queue stores values according to importance rather than arrival
order. Rust's `BinaryHeap<T>` is a max-heap: `peek` and `pop` expose the greatest
value first.

<div class="ds-demo" data-demo="binary-heap"></div>

## When to use `BinaryHeap`

Use it when the next value is determined by priority:

- Schedulers that run the most important job next.
- Top-k and streaming-selection problems.
- Graph algorithms such as Dijkstra's shortest path.
- Merging sorted streams.
- Simulations driven by the next scheduled event.

The decision rule is:

> Use `BinaryHeap` when you repeatedly need the current greatest—or
> smallest—value without keeping the entire collection sorted.

Use `VecDeque` when arrival order matters, `BTreeMap` when every value must be
traversable in sorted order, and `HashMap` when lookup happens by key.

## 1. The essential mental model

A binary heap is a complete binary tree stored inside a contiguous array. In a
max-heap, every parent is at least as large as its children:

```text
        90
      /    \
    70      80
   /  \    /
 20   40  30
```

The same tree can occupy an array without node pointers:

```text
[90, 70, 80, 20, 40, 30]
```

For a node at index `i`, its children are conceptually at `2i + 1` and
`2i + 2`. The heap guarantees only the parent-child ordering. Siblings and
separate branches are not globally sorted.

## 2. Push and pop

Pushing adds a value at the end, then moves it upward until the heap property is
restored. Popping removes the root, moves the final value into its place, then
moves that value downward.

```rust
use std::collections::BinaryHeap;

fn main() {
    let mut priorities = BinaryHeap::new();
    priorities.push(20);
    priorities.push(90);
    priorities.push(40);

    assert_eq!(priorities.peek(), Some(&90));
    assert_eq!(priorities.pop(), Some(90));
    assert_eq!(priorities.pop(), Some(40));
    assert_eq!(priorities.pop(), Some(20));
    assert_eq!(priorities.pop(), None);
}
```

`peek` borrows the greatest value. `pop` moves it out.

## 3. A minimum-priority heap

Wrap values in `Reverse` when the smallest value should come out first:

```rust
use std::cmp::Reverse;
use std::collections::BinaryHeap;

fn main() {
    let mut deadlines = BinaryHeap::new();
    deadlines.push(Reverse(30));
    deadlines.push(Reverse(10));
    deadlines.push(Reverse(20));

    assert_eq!(deadlines.pop(), Some(Reverse(10)));
    assert_eq!(deadlines.pop(), Some(Reverse(20)));
    assert_eq!(deadlines.pop(), Some(Reverse(30)));
}
```

The heap is still a max-heap; `Reverse<T>` reverses the ordering of `T`.

## 4. Priority scheduler

Include a sequence number when equal-priority jobs must remain in arrival order:

```rust
use std::cmp::Ordering;
use std::collections::BinaryHeap;

#[derive(Debug, Eq, PartialEq)]
struct Job {
    priority: u8,
    sequence: u64,
    name: &'static str,
}

impl Ord for Job {
    fn cmp(&self, other: &Self) -> Ordering {
        self.priority
            .cmp(&other.priority)
            .then_with(|| other.sequence.cmp(&self.sequence))
            .then_with(|| self.name.cmp(other.name))
    }
}

impl PartialOrd for Job {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

fn main() {
    let mut jobs = BinaryHeap::from([
        Job { priority: 2, sequence: 0, name: "compile" },
        Job { priority: 3, sequence: 1, name: "deploy" },
        Job { priority: 3, sequence: 2, name: "notify" },
    ]);

    assert_eq!(jobs.pop().unwrap().name, "deploy");
    assert_eq!(jobs.pop().unwrap().name, "notify");
    assert_eq!(jobs.pop().unwrap().name, "compile");
}
```

The comparison makes higher priority greater while making an earlier sequence
greater among ties.

## 5. Complexity

| Operation | Complexity |
|---|---:|
| `peek` | `O(1)` |
| `push` | amortized `O(log n)` |
| `pop` | `O(log n)` |
| Build from values | `O(n)` |
| Search for an arbitrary value | `O(n)` |
| Convert into sorted vector | `O(n log n)` |

Iteration does not produce sorted order. Repeatedly call `pop`, or consume the
heap with `into_sorted_vec`, when sorted output is required.

## 6. Sharp edges

- Equal values have no automatic FIFO guarantee; encode a tie-breaker when it
  matters.
- Changing a value so its ordering changes while it is inside the heap is a
  logic error. Use the APIs rather than interior mutation that changes priority.
- A heap is excellent at exposing one extreme value, not at searching for or
  deleting an arbitrary item.
- `BinaryHeap` requires `Ord`. Floating-point values need a deliberate ordering
  policy because ordinary floats do not implement total ordering.

## 7. What you should internalize

1. `BinaryHeap` is a max-priority queue.
2. `Reverse<T>` turns it into a min-priority queue.
3. Only the root is guaranteed to be the current extreme.
4. Push and pop repair a partial tree ordering in `O(log n)`.
5. Use a sequence number when equal priorities must remain FIFO.

## Exercise

Build a task queue whose larger priority runs first while equal priorities run
in insertion order. Push five tasks, including three with the same priority,
and assert the complete pop order.

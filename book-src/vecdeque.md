# 1. `VecDeque` — A Double-Ended Queue

A double-ended queue, often abbreviated to "deque" (pronounced "deck"), is an
abstract data type that generalizes a queue, allowing elements to be added to
or removed from both the front and the back.

`VecDeque<T>` is Rust's growable double-ended queue.

Its defining property is:

> It supports efficient insertion and removal at both the front and the back.

## When to use `VecDeque`

Use `VecDeque` when values remain in an ordered sequence and operations at the
front are routine—not exceptional.

Common cases include:

- **FIFO queues:** add new work at the back and process the oldest work from the
  front.
- **Worklists and breadth-first search:** visit items in discovery order while
  adding newly discovered items at the back.
- **Rolling or sliding windows:** append new observations and discard expired
  ones from the front.
- **Bounded histories and stream buffers:** retain recent values while evicting
  the oldest.
- **Algorithms that use both ends deliberately:** for example, 0–1 BFS adds
  zero-cost edges at the front and one-cost edges at the back.

The simplest decision rule is:

> Use `VecDeque` when the ends are active—especially when removing from the
> front is routine.

Choose another structure when the access pattern is different:

- Use `Vec` when you mainly add and remove at the back or need one contiguous
  slice.
- Use `BinaryHeap` when the highest-priority value should come out first.
- Use `HashMap` when values are found by key rather than position.
- Use a channel when concurrent producers and consumers must wait for and wake
  one another.
- Consider another representation when arbitrary searches, insertions, or
  removals from the middle dominate the workload.

Use the controls below. Watch how `head` moves while the logical order remains
normal.

<div id="vecdeque-ring-explainer">
  <div class="vd-status" aria-live="polite">
    <span><strong>head</strong> = <span data-head>6</span></span>
    <span><strong>len</strong> = <span data-len>4</span></span>
    <span><strong>capacity</strong> = 8</span>
    <span><strong>tail-next</strong> = <span data-tail>2</span></span>
  </div>
  <div class="vd-stage">
    <svg viewBox="0 0 560 360" role="img" aria-labelledby="vd-title vd-desc">
      <title id="vd-title">VecDeque circular buffer simulator</title>
      <desc id="vd-desc">Eight physical slots arranged in a ring. Filled slots hold the deque in logical front-to-back order, beginning at head.</desc>
      <g data-ring></g>
      <text x="280" y="166" class="vd-center-label">logical front</text>
      <text x="280" y="190" class="vd-value" data-front>10</text>
      <text x="280" y="218" class="vd-center-label">front → back</text>
    </svg>
  </div>
  <div class="vd-logical" data-logical aria-live="polite">[10, 20, 30, 40]</div>
  <div class="vd-controls" aria-label="Deque operations">
    <button type="button" data-op="push_front">push_front</button>
    <button type="button" data-op="pop_front">pop_front</button>
    <button type="button" data-op="push_back">push_back</button>
    <button type="button" data-op="pop_back">pop_back</button>
    <button class="secondary" type="button" data-op="reset">Reset</button>
  </div>
  <div class="vd-event" data-event aria-live="polite">Initial state wraps from slot 7 to slot 0.</div>
  <noscript>The interactive controls require JavaScript.</noscript>
</div>

## 1. The essential mental model

A `Vec<T>` is conceptually:

- One contiguous allocation.
- The first element lives at physical slot `0`.
- Adding or removing at the back is cheap.
- Removing from the front requires shifting every remaining element.

A `VecDeque<T>` is also backed by an array-like allocation, but it treats that
allocation as a circle.

Conceptually, it tracks:

```text
buffer: allocation containing capacity slots
head:   physical slot containing the logical front
len:    number of initialized elements
```

The exact private implementation is not guaranteed, but this is the correct
conceptual model.

For logical index `i`:

```text
physical_index = (head + i) % capacity
```

Therefore:

```text
deque[0]         // element at physical slot head
deque[1]         // element at (head + 1) % capacity
deque[len - 1]   // logical back
```

The user of `VecDeque` sees logical order. The wraparound is hidden.

## 2. Why the circular buffer matters

Suppose the front is in physical slot `6` of an eight-slot allocation, and the
logical contents are:

```text
[10, 20, 30, 40]
```

They can physically occupy:

| Physical slot | Value |
|---:|---:|
| 0 | 30 |
| 1 | 40 |
| 2–5 | unused |
| 6 | 10—the front |
| 7 | 20 |

The sequence wraps from the end of the allocation back to its beginning.

Yet these all operate in logical order:

```text
deque.front();     // Some(&10)
deque.back();      // Some(&40)
deque.get(2);      // Some(&30)
deque.iter();      // 10, 20, 30, 40
```

Physical layout and logical order are different concepts.

## 3. How the four central operations work

Assuming available capacity:

### `push_back(value)`

The next back slot is conceptually:

```text
tail_next = (head + len) % capacity
```

Write there and increment `len`.

### `pop_back()`

Find:

```text
back = (head + len - 1) % capacity
```

Move the value out and decrement `len`.

### `push_front(value)`

Move the head one slot backward, wrapping if necessary:

```text
head = previous_slot(head)
```

Write the value at the new head and increment `len`.

### `pop_front()`

Move the value out of `head`, advance `head`, and decrement `len`.

None of these operations needs to shift all the other elements.

That is the entire reason `VecDeque` exists.

## 4. The basic Rust API

```rust
use std::collections::VecDeque;

fn main() {
    let mut deque = VecDeque::new();

    deque.push_back(20);
    deque.push_back(30);
    deque.push_front(10);

    assert_eq!(deque.front(), Some(&10));
    assert_eq!(deque.back(), Some(&30));
    assert_eq!(deque[1], 20);

    assert_eq!(deque.pop_front(), Some(10));
    assert_eq!(deque.pop_back(), Some(30));
    assert_eq!(deque.pop_front(), Some(20));
    assert_eq!(deque.pop_front(), None);
}
```

Notice the ownership behavior:

```text
deque.push_back(value);
```

moves `value` into the deque.

```text
deque.pop_front()
```

returns `Option<T>`, moving the element back out.

Reading without removing uses references:

```text
deque.front()      // Option<&T>
deque.front_mut()  // Option<&mut T>
deque.get(i)       // Option<&T>
deque.get_mut(i)   // Option<&mut T>
```

Indexing panics when out of bounds:

```text
let x = deque[100]; // panic if len <= 100
```

Prefer `get()` when the index might be invalid.

## 5. Complexity

| Operation | Complexity |
|---|---:|
| `front`, `back` | `O(1)` |
| `get(i)`, indexing | `O(1)` |
| `push_front`, `push_back` | amortized `O(1)` |
| `pop_front`, `pop_back` | `O(1)` |
| Search by value | `O(n)` |
| Iterate | `O(n)` |
| Insert or remove in the middle | `O(min(i, n-i))` |
| Make storage contiguous | worst-case `O(n)` |

“Amortized `O(1)`” means most pushes are constant time, but a push into a full
deque may require:

1. Allocating a larger buffer.
2. Moving the existing elements.
3. Freeing the old buffer.

That individual push is `O(n)`, but spread across many pushes, the average cost
is constant.

You can reduce reallocations:

```rust
use std::collections::VecDeque;

fn main() {
    let queue: VecDeque<i32> = VecDeque::with_capacity(10_000);
    assert!(queue.capacity() >= 10_000);
    assert!(queue.is_empty());
}
```

This reserves space for at least that many elements. It does not create or
initialize 10,000 values.

## 6. The full-versus-empty problem

Consider:

```text
tail_next = (head + len) % capacity
```

When the deque is empty:

```text
len == 0
tail_next == head
```

When the deque is completely full:

```text
len == capacity
tail_next == head
```

Therefore, `head == tail_next` alone cannot distinguish empty from full.

The deque also needs `len`, or an equivalent piece of state. This is one of the
fundamental invariants:

```text
0 <= len <= capacity
```

The occupied elements are exactly the `len` slots encountered by walking
forward from `head`, wrapping at the allocation boundary.

## 7. It may not be one contiguous slice

Because the sequence can wrap, a `VecDeque` cannot always expose all its
elements as one `&[T]`.

Instead, `as_slices()` returns the contents as two slices:

```rust
use std::collections::VecDeque;

fn main() {
    let deque = VecDeque::from([10, 20, 30, 40]);
    let (first, second) = deque.as_slices();

    let logical: Vec<_> = first.iter().chain(second).copied().collect();
    assert_eq!(logical, vec![10, 20, 30, 40]);
}
```

If the deque does not wrap, `second` will be empty. If it does wrap, both slices
may contain elements. Their chained order is always the deque's logical order.

If an operation requires one contiguous slice:

```rust
use std::collections::VecDeque;

fn main() {
    let mut deque = VecDeque::from([30, 10, 20]);
    let slice: &mut [i32] = deque.make_contiguous();
    slice.sort();

    assert_eq!(deque, VecDeque::from([10, 20, 30]));
}
```

`make_contiguous()` may rotate or move elements, so it can cost `O(n)`. Do not
call it repeatedly in a hot loop without measuring.

## 8. Why it is generally faster than `LinkedList`

Both structures provide efficient operations at their ends, but their memory
layouts differ.

A linked list usually stores every element in a separate node containing
pointers. This causes:

- One or more pointers of overhead per element.
- More allocations.
- Pointer chasing.
- Poor CPU cache locality.
- No constant-time indexing.

A `VecDeque` stores elements densely in one allocation, possibly divided into
two physical regions by wraparound. It therefore normally has much better cache
behavior and supports `O(1)` indexing.

In Rust, `LinkedList` is rarely the default answer. `VecDeque` is usually
preferable for queues and worklists.

## 9. `Vec` versus `VecDeque`

Use `Vec<T>` when:

- You mainly push and pop at the back.
- You want the simplest contiguous representation.
- You frequently pass the contents as a slice.
- Front removal is rare.
- Slightly lower overhead matters.

Use `VecDeque<T>` when:

- You regularly remove from the front.
- You insert at both ends.
- You need FIFO queue behavior.
- You need a rolling window.
- You need a BFS or scheduler work queue.

The classic mistake is implementing a queue with:

```text
let item = vec.remove(0);
```

That shifts everything left and costs `O(n)` per removal. Processing an entire
queue this way can become `O(n²)`.

With `VecDeque`:

```text
let item = deque.pop_front();
```

each removal is `O(1)`.

## 10. Canonical queue pattern

```rust
use std::collections::VecDeque;

fn main() {
    let mut jobs = VecDeque::new();

    jobs.push_back("job-a");
    jobs.push_back("job-b");
    jobs.push_back("job-c");

    while let Some(job) = jobs.pop_front() {
        println!("processing {job}");
    }
}
```

This is FIFO:

```text
first in → first out
```

For a stack, you normally use `Vec`, but `VecDeque` can also behave like one by
pairing `push_back` with `pop_back`.

## 11. Breadth-first search

A deque is the standard structure for BFS:

```rust
use std::collections::{HashSet, VecDeque};

fn bfs(start: usize, graph: &[Vec<usize>]) -> Vec<usize> {
    let mut visited = HashSet::new();
    let mut queue = VecDeque::new();
    let mut order = Vec::new();

    visited.insert(start);
    queue.push_back(start);

    while let Some(node) = queue.pop_front() {
        order.push(node);

        for &neighbor in &graph[node] {
            if visited.insert(neighbor) {
                queue.push_back(neighbor);
            }
        }
    }

    order
}

fn main() {
    let graph = vec![vec![1, 2], vec![3], vec![3], vec![]];
    assert_eq!(bfs(0, &graph), vec![0, 1, 2, 3]);
}
```

Nodes are processed in the order they are discovered.

A deque is also used for algorithms such as 0–1 BFS, where zero-cost edges go
to the front and one-cost edges go to the back.

## 12. Rolling windows

Suppose you retain only the last 1,000 market-data ticks:

```rust
use std::collections::VecDeque;

fn add_tick<T>(ticks: &mut VecDeque<T>, tick: T, max_len: usize) {
    if max_len == 0 {
        return;
    }

    if ticks.len() == max_len {
        ticks.pop_front();
    }

    ticks.push_back(tick);
}

fn main() {
    let mut ticks = VecDeque::new();

    for tick in [10, 20, 30, 40] {
        add_tick(&mut ticks, tick, 3);
    }

    assert_eq!(ticks, VecDeque::from([20, 30, 40]));
}
```

For a time-based window, add the new event and evict expired events from the
front:

```text
events.push_back(new_event);

while events
    .front()
    .is_some_and(|event| event.timestamp < cutoff)
{
    events.pop_front();
}
```

Although one update might evict several old events, each event enters once and
leaves once. Across the entire stream, eviction is amortized `O(1)` per event.

This is a strong use of `VecDeque`.

## 13. The LRU-cache trap

For a strict `O(1)` least-recently-used cache, `VecDeque` is usually the wrong
recency structure—but that does not make every deque-based cache a bad design.

### The simple design

A small dependency-free cache might use:


```text
HashMap: key → value
VecDeque: least-recent key → ... → most-recent key
```

When a key is accessed, the cache finds it in the deque, removes it, and pushes
it onto the most-recent end:

```text
let position = deque.iter().position(|key| key == wanted); // O(n)
deque.remove(position);                                    // O(n) in general
deque.push_back(wanted);
```

The lookup in the hash map is expected `O(1)`, but refreshing recency is `O(n)`.
This is not a strict constant-time LRU.

It can still be a sensible implementation:

- It uses only safe standard-library types.
- It is short and easy to verify.
- The keys are stored densely with good cache locality.
- It has no node handles or pointer relationships to maintain.
- A linear scan over 32 or 100 entries may be extremely cheap.

Big-O describes how cost grows; it does not describe every constant factor. A
simple contiguous scan can outperform a more elaborate linked structure at
small capacities.

### What strict `O(1)` requires

A genuinely `O(1)` LRU normally needs:

- A hash map for key lookup.
- A doubly linked recency structure.
- Stable node handles or indices connecting the two.

The map finds a node in expected `O(1)`. The linked structure then detaches that
node and moves it to the most-recent end in `O(1)`.

This relationship is awkward to express with ordinary Rust references. Moving
values can invalidate references, multiple mutable links need careful control,
and `LinkedList` does not expose convenient persistent handles for arbitrary
nodes. Safe custom implementations commonly use stable integer IDs into an
arena or slab rather than references between nodes.

That design offers stronger asymptotic guarantees, but it is substantially
more code than a map and a deque.

### A deque of stale access records

Another design avoids middle removal by treating the deque as an append-only
recency log. Each access receives a new generation:

```text
map:
A → generation 9
B → generation 4

deque, oldest to newest:
(A, 7), (B, 4), (A, 8), (A, 9)
```

Accessing `A` appends `(A, 9)` without searching for its older records. During
eviction, the cache pops from the front until it finds a record whose generation
still matches the map:

```text
while let Some((key, generation)) = order.pop_front() {
    if map[key].generation == generation {
        evict(key);
        break;
    }

    // An old access record: discard it and continue.
}
```

Each record is appended once and eventually removed once, giving amortized
`O(1)` queue work. The tradeoff moves from time to space: repeated hits create
stale records, so the implementation needs a bound or periodic compaction.

This is a particularly natural use of `VecDeque`. The design needs efficient
append-at-back and discard-from-front operations—the deque's exact strengths.

### Approximate recency

Strict LRU turns every cache hit into a metadata write. Large or concurrent
caches often relax the policy to reduce work and contention. They may:

- Record access events and apply them in batches.
- Refresh recency only after a time threshold.
- Divide entries into generations or segments.
- Sample several candidates and evict the oldest sample.
- Use policies such as CLOCK rather than exact LRU.

A `VecDeque` can hold access events, generations, or FIFO membership within a
segment even when it is not the structure used to find arbitrary cache entries.

Seeing a deque in cache code therefore does not prove that hits scan and reorder
it. The deque might instead manage expiration, deferred cleanup, free nodes,
admission, or stale access records. Follow the cache-hit path before judging its
complexity.

### The real decision

| Situation | Reasonable starting point |
|---|---|
| Small cache | `HashMap + VecDeque` with a linear scan |
| Learning exercise | `HashMap + VecDeque` |
| Standard library only | `HashMap + VecDeque` |
| Stale generation log | `HashMap + VecDeque` |
| Large cache requiring strict `O(1)` recency | Linked structure with stable node IDs |
| Highly concurrent cache | Sharded or approximate recency design |

The useful conclusion is:

> People use `VecDeque` because it is simple, safe, cache-friendly, and often
> fast enough—not because it provides the theoretically optimal strict LRU.

## 14. Middle operations are possible, but not its strength

```text
deque.insert(index, value);
let removed = deque.remove(index);
```

`VecDeque` can shift whichever side is closer:

```text
cost ≈ min(distance to front, distance to back)
```

This is better than always shifting the entire suffix, but it is still linear
in the general case.

For an order-book price level, for example, a `VecDeque` is excellent for FIFO
execution at the front. But if arbitrary orders are constantly cancelled from
the middle by ID, repeatedly searching and removing them becomes expensive. You
may need stable handles, a slab, linked nodes, or lazy cancellation.

## 15. Memory safety underneath

Internally, capacity slots are not all necessarily initialized `T` values.

Only the logical `len` occupied slots contain live elements. The unused slots
are conceptually uninitialized storage.

When you call:

```text
let item = deque.pop_front();
```

Rust moves the value out. That slot must no longer be treated as containing a
valid `T`.

When the deque is dropped, the standard library drops exactly the remaining
live elements—not every capacity slot. The implementation uses carefully
audited `unsafe` machinery internally, while the public API keeps this safe.

This distinction explains why `capacity != len` and why reserving capacity does
not construct extra values.

## 16. Concurrency

`VecDeque` does not make queue operations atomic. If multiple threads mutate
one queue, it needs synchronization:

```rust,ignore
use std::collections::VecDeque;
use std::sync::{Arc, Mutex};

let queue = Arc::new(Mutex::new(VecDeque::<Job>::new()));
```

Keep the critical section short:

```rust,ignore
let job = {
    let mut queue = queue.lock().unwrap();
    queue.pop_front()
};

// Do slow or async work after releasing the lock.
process(job).await;
```

Do not hold a synchronous mutex guard across `.await`.

For high-throughput producer/consumer systems, a channel or specialized
concurrent queue may be better than `Mutex<VecDeque<T>>`.

## 17. What you should internalize

The durable model is:

1. `VecDeque` is a growable circular buffer.
2. `head` identifies the physical location of logical index zero.
3. Logical index `i` maps around the allocation boundary.
4. Moving either end generally changes metadata, not all the elements.
5. End operations are `O(1)` unless a push triggers growth.
6. Logical order may occupy two physical slices.
7. Random access is `O(1)`, but searching and middle removal are still linear.
8. It is ideal for FIFO queues, BFS, worklists, and rolling windows.
9. It does not solve strict `O(1)` LRU recency updates.

A useful test: with capacity `8`, `head = 6`, and `len = 4`, determine the
physical slot used by `push_back`, then by `push_front`. If you can calculate
both without guessing, you understand the core mechanism.

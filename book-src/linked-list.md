# `LinkedList` — A Doubly Linked List

A linked list is a linear data structure whose elements live in separate
nodes. Pointers connect each node to the next node in the sequence. The list
keeps track of its first node, called the **head**, and often its last node,
called the **tail**.

Rust's `std::collections::LinkedList<T>` is a growable, doubly linked list.

<div class="ds-demo" data-demo="linked-list"></div>

## When to use `LinkedList`

Use a linked list when its node-based structure is itself useful—not merely
because the collection must grow.

Possible cases include:

- You frequently push and pop values at both ends.
- You need to join two whole lists in constant time with `append`.
- Sequential traversal is sufficient and random access is unimportant.
- Moving elements in one contiguous allocation would be unusually expensive,
  and profiling shows that a linked representation performs better.

In ordinary Rust programs, start with `Vec` or `VecDeque`. They store elements
densely, require fewer allocations, and usually benefit much more from the
CPU cache. Choose `LinkedList` because measurements or a specific operation
justify it, not as the default representation for a growable collection.

The simplest decision rule is:

> Use `LinkedList` only when you need linked-list behavior; use `VecDeque` for
> an ordinary queue.

## 1. The essential mental model

A linked list stores a value and its connections together in a node.

A **singly linked list** node contains:

```text
value | next
```

Each node points to the following node. The final node's `next` link is empty.
Traversal moves only from front to back.

A **doubly linked list** node contains:

```text
previous | value | next
```

The extra link permits traversal in both directions. Rust's standard
`LinkedList` uses this doubly linked structure and tracks both ends:

```text
head                                                   tail
  ↓                                                       ↓
None ← [ A ] ⇄ [ B ] ⇄ [ C ] ⇄ [ D ] → None
```

The diagram shows logical connections, not adjacent memory. Nodes may occupy
unrelated addresses in the heap.

## 2. What the links buy you

Removing the first node does not shift the other values. The list changes its
head and repairs a small number of links:

```text
before: None ← [ A ] ⇄ [ B ] ⇄ [ C ] → None
after:         None ← [ B ] ⇄ [ C ] → None
```

The same principle applies at the back. Given direct access to a node, a
traditional doubly linked list can also unlink it by updating its two
neighbors.

This leads to the familiar claim that linked lists support `O(1)` insertion and
deletion. The qualification matters:

> The operation is `O(1)` only after you already know the node or insertion
> point.

Finding the node by value or logical position still requires walking through
the list and costs `O(n)`. Rust's ordinary stable `LinkedList` interface is
centered on operations at the ends, iteration, and operations on whole lists;
it does not behave like an indexable collection of public node handles.

## 3. The basic Rust API

```rust
use std::collections::LinkedList;

fn main() {
    let mut list = LinkedList::new();

    list.push_back(20);
    list.push_back(30);
    list.push_front(10);

    assert_eq!(list.front(), Some(&10));
    assert_eq!(list.back(), Some(&30));

    assert_eq!(list.pop_front(), Some(10));
    assert_eq!(list.pop_back(), Some(30));
    assert_eq!(list.pop_front(), Some(20));
    assert_eq!(list.pop_front(), None);
}
```

The end operations mirror `VecDeque`:

| Operation | Front | Back |
|---|---|---|
| Add | `push_front` | `push_back` |
| Inspect | `front` | `back` |
| Mutably inspect | `front_mut` | `back_mut` |
| Remove | `pop_front` | `pop_back` |

Pushing moves a value into the list. Popping returns `Option<T>`, moving a value
back out. Inspecting returns a reference because the value stays inside the
list.

Unlike `Vec` and `VecDeque`, `LinkedList` does not support indexing:

```text
list[3] // not supported
```

An index would suggest cheap random access, but reaching the fourth element
requires following links through the preceding nodes.

## 4. A complete example

This example demonstrates construction, traversal, removal, search, and
clearing:

```rust
use std::collections::LinkedList;

fn main() {
    let mut list: LinkedList<u32> = LinkedList::new();

    list.push_back(10);
    list.push_back(20);
    list.push_back(30);
    list.push_front(5);

    println!("Linked list after insertions:");
    for element in &list {
        println!("{element}");
    }

    list.pop_front();
    list.pop_back();

    println!("\nLinked list after removals:");
    for element in &list {
        println!("{element}");
    }

    if list.contains(&20) {
        println!("\n20 exists in the list!");
    }

    list.clear();
    println!("\nLinked list after clearing: {list:?}");
}
```

The program prints:

```text
Linked list after insertions:
5
10
20
30

Linked list after removals:
10
20

20 exists in the list!

Linked list after clearing: []
```

`contains` reads naturally, but it performs a sequential search. It may inspect
every node.

## 5. Complexity

| Operation | Complexity |
|---|---:|
| `front`, `back` | `O(1)` |
| `push_front`, `push_back` | `O(1)` |
| `pop_front`, `pop_back` | `O(1)` |
| `len`, `is_empty` | `O(1)` |
| `append` another whole list | `O(1)` |
| Search by value | `O(n)` |
| Access logical position `i` by traversal | `O(n)` |
| Iterate over every value | `O(n)` |
| `split_off(at)` | `O(n)` |

The table describes asymptotic growth, not real-world speed. An `O(n)` scan
over a contiguous `Vec` can outperform an `O(n)` linked-list traversal by a
large margin because the vector has better locality.

## 6. Joining whole lists

`append` is one operation that exposes the value of explicit links. It moves
all nodes from one list onto the back of another without copying each element:

```rust
use std::collections::LinkedList;

fn main() {
    let mut first = LinkedList::from([1, 2]);
    let mut second = LinkedList::from([3, 4]);

    first.append(&mut second);

    assert_eq!(first, LinkedList::from([1, 2, 3, 4]));
    assert!(second.is_empty());
}
```

The second list is empty afterward because ownership of its nodes moves into
the first list.

## 7. Dynamic size does not distinguish it from `Vec`

Linked lists are often introduced as “dynamic,” but that description is not a
reason to choose one in Rust. `Vec`, `VecDeque`, `HashMap`, and many other
collections also grow and shrink dynamically.

The meaningful distinction is how they grow:

- `Vec` keeps elements in one contiguous allocation and occasionally moves them
  when that allocation grows.
- `VecDeque` keeps elements in a growable ring buffer that may wrap into two
  contiguous regions.
- `LinkedList` allocates and connects separate nodes.

Ask which memory layout and access pattern the program needs, not merely
whether the number of elements changes.

## 8. The memory cost of nodes

Each doubly linked node needs space for:

```text
previous pointer + value + next pointer
```

It also normally requires a separate allocation. Compared with a dense
collection, this introduces:

- Two links per element.
- Allocation metadata and allocator work.
- More addresses for the CPU to load.
- Less useful data per cache line.
- Pointer chasing during traversal.

For small values, the links may consume more space than the values themselves.
This is why theoretical `O(1)` end operations do not automatically make a
linked list faster than `VecDeque`.

## 9. `Vec`, `VecDeque`, or `LinkedList`?

| Access pattern | Start with |
|---|---|
| Add and remove mainly at the back | `Vec<T>` |
| Add or remove at both ends | `VecDeque<T>` |
| Random access by index | `Vec<T>` or `VecDeque<T>` |
| Pass values as a slice | `Vec<T>` |
| Join complete lists frequently | `LinkedList<T>` may fit |
| Sequential node-based structure is specifically required | `LinkedList<T>` |

For a FIFO queue, both `VecDeque` and `LinkedList` have constant-time end
operations. Prefer `VecDeque` unless a benchmark or a linked-list-specific
operation demonstrates a reason not to.

## 10. Ownership and mutation

Mutable iteration can change values without changing the links:

```rust
use std::collections::LinkedList;

fn main() {
    let mut values = LinkedList::from([1, 2, 3]);

    for value in &mut values {
        *value *= 10;
    }

    assert_eq!(values, LinkedList::from([10, 20, 30]));
}
```

Rust's borrowing rules prevent structural mutation through the list while an
iterator is borrowing it. This keeps iterators and references from silently
pointing at removed nodes.

## 11. What you should internalize

The durable model is:

1. A linked list stores values in separate connected nodes.
2. Rust's `LinkedList` is doubly linked and tracks both ends.
3. Pushes and pops at either end are `O(1)`.
4. Search and positional access are `O(n)`.
5. Arbitrary deletion is only `O(1)` after the node is already known.
6. Nodes add pointer, allocation, and cache-locality costs.
7. Dynamic size alone is not a reason to choose a linked list.
8. `VecDeque` is normally the better queue.
9. `LinkedList` earns its place when linked-list-specific operations or
   measurements justify it.

## Exercise

Create two lists, keep references to their first values, append the second list
to the first, and confirm the resulting order. Then write the equivalent using
`VecDeque` and compare which operations each version expresses naturally.

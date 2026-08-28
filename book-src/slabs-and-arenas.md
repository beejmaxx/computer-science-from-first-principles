# Slabs and Arenas — Stable Handles

Slabs and arenas store many values in one managed region and identify them with
small handles. They are useful when values refer to one another, must be found
quickly by ID, or need identities that survive ordinary collection growth.

<div class="ds-demo" data-demo="arena"></div>

## When to use slabs and arenas

Use this family of structures when:

- Graph nodes refer to other graph nodes.
- A hash map must point directly to nodes in another structure.
- Orders, tasks, entities, or sessions need compact stable IDs.
- A linked structure is easier to express with indices than Rust references.
- You allocate many related values and want to release them together.
- You need to reuse vacant storage without moving every live value.

The decision rule is:

> Use handles when identity must outlive a borrow, and use generations when a
> reused slot must not revive an old identity.

Use an ordinary `Vec` when position already is identity and elements are not
removed individually. Use `HashMap` when an existing domain key is sufficient.

## 1. Why ordinary references are difficult here

Consider a doubly linked cache node:

```text
previous ← [ key | value ] → next
```

If `previous` and `next` were ordinary Rust references into a growable `Vec`, a
reallocation could move the nodes and invalidate those references. Long-lived
mutable references between nodes also conflict with Rust's requirement that a
value have only one active mutable reference.

A handle changes the relationship:

```text
node.previous = Some(Handle { index: 7, generation: 3 })
node.next     = Some(Handle { index: 2, generation: 8 })
```

The handle is data, not a borrow. Code resolves it through the arena each time
it needs the value.

Growing the arena may move its internal allocation, but index `7` still means
slot `7`. No pointer into the old allocation is retained.

## 2. Arena, slab, and generational arena

The names overlap, but these models are useful:

- **Arena:** allocates many related values in a shared region, often releasing
  them all together.
- **Slab:** stores values in indexed slots and maintains a free list so removed
  slots can be reused individually.
- **Generational arena:** pairs each slot index with a version number so stale
  handles are rejected after reuse.

A simple slab might look like:

```text
slots: [ A | empty | C | D | empty ]
free:  [ 1, 4 ]
```

Inserting can pop an index from `free` rather than growing `slots`.

## 3. The stale-handle problem

Suppose handle `1` refers to an order in slot `1`:

```text
handle 1 ──▶ order A
```

The order is removed, and the slab later reuses slot `1`:

```text
handle 1 ──▶ order B
```

An old handle for order A now appears to identify order B. This is sometimes
called an ABA problem: the slot changed from A to empty to B, but the numeric
index looks unchanged.

A generation distinguishes the identities:

```text
old handle: Handle { index: 1, generation: 4 }
new handle: Handle { index: 1, generation: 5 }
```

Lookup succeeds only when both the index and generation match.

## 4. A small generational arena

This complete implementation uses only the standard library:

```rust
#[derive(Clone, Copy, Debug, Eq, Hash, PartialEq)]
struct Handle {
    index: usize,
    generation: u64,
}

#[derive(Debug)]
struct Slot<T> {
    generation: u64,
    value: Option<T>,
}

#[derive(Debug)]
struct Arena<T> {
    slots: Vec<Slot<T>>,
    free: Vec<usize>,
}

impl<T> Arena<T> {
    fn new() -> Self {
        Self {
            slots: Vec::new(),
            free: Vec::new(),
        }
    }

    fn insert(&mut self, value: T) -> Handle {
        if let Some(index) = self.free.pop() {
            let slot = &mut self.slots[index];
            debug_assert!(slot.value.is_none());
            slot.value = Some(value);

            Handle {
                index,
                generation: slot.generation,
            }
        } else {
            let index = self.slots.len();
            self.slots.push(Slot {
                generation: 0,
                value: Some(value),
            });

            Handle {
                index,
                generation: 0,
            }
        }
    }

    fn get(&self, handle: Handle) -> Option<&T> {
        let slot = self.slots.get(handle.index)?;

        if slot.generation != handle.generation {
            return None;
        }

        slot.value.as_ref()
    }

    fn get_mut(&mut self, handle: Handle) -> Option<&mut T> {
        let slot = self.slots.get_mut(handle.index)?;

        if slot.generation != handle.generation {
            return None;
        }

        slot.value.as_mut()
    }

    fn remove(&mut self, handle: Handle) -> Option<T> {
        let slot = self.slots.get_mut(handle.index)?;

        if slot.generation != handle.generation {
            return None;
        }

        let value = slot.value.take()?;
        slot.generation = slot
            .generation
            .checked_add(1)
            .expect("arena generation exhausted");
        self.free.push(handle.index);
        Some(value)
    }
}

fn main() {
    let mut arena = Arena::new();

    let old = arena.insert(String::from("order-a"));
    arena.get_mut(old).unwrap().push_str("-updated");
    assert_eq!(arena.get(old).map(String::as_str), Some("order-a-updated"));

    assert_eq!(arena.remove(old), Some(String::from("order-a-updated")));
    assert_eq!(arena.get(old), None);

    let new = arena.insert(String::from("order-b"));
    assert_eq!(new.index, old.index);
    assert_ne!(new.generation, old.generation);

    // Reusing the slot did not make the old handle valid again.
    assert_eq!(arena.get(old), None);
    assert_eq!(arena.get(new).map(String::as_str), Some("order-b"));
}
```

The free list makes reuse constant time. The generation check turns a stale
handle into `None` rather than silently selecting a different value.

## 5. Complexity

| Operation | Complexity |
|---|---:|
| Insert into a free slot | `O(1)` |
| Insert by growing storage | amortized `O(1)` |
| Resolve a handle | `O(1)` |
| Remove by handle | `O(1)` |
| Iterate over every slot | `O(capacity)` |

The arena may contain holes, so its slot capacity can be larger than its number
of live values. Compacting those holes would change indices and invalidate
handles unless the arena also maintains a layer of indirection.

## 6. Building linked structures with handles

A strict LRU cache can store links as handles:

```text
HashMap<K, Handle>

Node<K, V> {
    key: K,
    value: V,
    previous: Option<Handle>,
    next: Option<Handle>,
}

Arena<Node<K, V>>
```

The map finds a node in expected `O(1)`. The cache uses its `previous` and
`next` handles to detach and reattach it in `O(1)`.

The same representation is useful for:

- **Order management:** `HashMap<OrderId, Handle>` finds an order for
  cancellation while price-level links preserve execution order.
- **Graphs:** nodes store handles for neighboring nodes.
- **Schedulers:** a public task ID resolves to mutable task state.
- **Entity systems:** components refer to entities without holding Rust
  references into a moving allocation.

## 7. Handles are not references

A handle does not keep its target alive. Removal can invalidate it, so lookup
returns `Option`.

A handle also does not carry borrowing rules by itself. The arena still controls
access:

```text
arena.get(handle)      → Option<&T>
arena.get_mut(handle)  → Option<&mut T>
```

When an operation must modify two nodes, code cannot simply call `get_mut`
twice while retaining the first mutable reference. Common approaches include:

- Copy the neighboring handles, end the first borrow, then mutate each node in
  separate steps.
- Use `split_at_mut` internally after proving the indices differ.
- Provide a carefully designed `get_many_mut` operation that rejects duplicate
  handles.
- Move the multi-node operation inside the arena so it can enforce the
  invariant centrally.

This friction is useful: it forces aliasing assumptions to become explicit.

## 8. Generation policy

The sample uses a `u64` generation and refuses to wrap. A production arena must
choose a policy deliberately:

- Use a sufficiently wide generation counter.
- Treat exhaustion as an unrecoverable invariant failure.
- Retire a slot permanently before its generation wraps.
- Document whether handles may cross process, persistence, or network
  boundaries.

Serializing a raw handle is dangerous when the arena may be rebuilt. An index
and generation identify a slot within a particular arena instance, not a
universal domain entity.

## 9. Arena allocation without individual removal

Not every arena needs reusable slots. Parsers, compilers, and request-scoped
work often allocate many objects that all share one lifetime. A bump-style
arena advances an allocation cursor for each value and releases the entire
region at once.

That design trades individual removal for extremely cheap allocation and bulk
cleanup. It is a different answer to the same question: which lifetime and
identity operations does the workload actually require?

## 10. Sharp edges

- A bare index is vulnerable to stale-handle aliasing after slot reuse.
- Generations reduce that risk only while they do not wrap.
- Handles are meaningful only with the arena that created them.
- Removing values creates holes and can retain unused capacity.
- Compacting storage normally invalidates handles.
- A custom arena is easy to get subtly wrong; prefer a well-tested
  implementation when the design becomes infrastructure.
- Stable handles do not imply stable memory addresses.

## 11. What you should internalize

1. Handles replace long-lived internal references with resolvable IDs.
2. A slab reuses indexed slots through a free list.
3. A generation prevents an old handle from naming a new occupant.
4. Insert, lookup, and removal can all be constant time.
5. Holes trade memory density for stable identity.
6. Handle-based links make graphs, LRUs, and order structures easier to express
   safely in Rust.
7. The arena remains responsible for borrowing, lifetime, and generation
   invariants.

## Exercise

Insert a value, remove it, and reuse its slot. Prove with assertions that the
old handle is rejected while the new handle resolves, even though both handles
contain the same slot index.

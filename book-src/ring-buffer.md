# 17. Ring Buffer — Fixed-Capacity Streaming

A fixed-capacity ring buffer reuses a bounded allocation by wrapping its read
and write positions around the end.

## When to use it

Use one for bounded histories, audio or network buffers, telemetry, and
producer/consumer pipelines where allocation after initialization is unwanted.

<div class="ds-demo" data-demo="ring"></div>

## 1. Overwriting implementation

```rust
struct RingBuffer<T> {
    slots: Vec<Option<T>>,
    head: usize,
    len: usize,
}

impl<T> RingBuffer<T> {
    fn new(capacity: usize) -> Self {
        assert!(capacity > 0);
        Self {
            slots: (0..capacity).map(|_| None).collect(),
            head: 0,
            len: 0,
        }
    }

    fn push(&mut self, value: T) -> Option<T> {
        let capacity = self.slots.len();
        let index = (self.head + self.len) % capacity;
        if self.len < capacity {
            self.slots[index] = Some(value);
            self.len += 1;
            None
        } else {
            let replaced = self.slots[self.head].replace(value);
            self.head = (self.head + 1) % capacity;
            replaced
        }
    }

    fn pop(&mut self) -> Option<T> {
        if self.len == 0 { return None; }
        let value = self.slots[self.head].take();
        self.head = (self.head + 1) % self.slots.len();
        self.len -= 1;
        value
    }
}

fn main() {
    let mut ring = RingBuffer::new(3);
    assert_eq!(ring.push(10), None);
    ring.push(20);
    ring.push(30);
    assert_eq!(ring.push(40), Some(10));
    assert_eq!(ring.pop(), Some(20));
}
```

This policy overwrites the oldest value. Other APIs reject new values or block
the producer when full. That policy is part of the data structure's contract.

## 2. Ring buffer versus `VecDeque`

`VecDeque` grows and offers a rich collection API. A fixed ring buffer promises
bounded memory and makes overflow behavior explicit. Concurrent lock-free rings
also require atomic ordering and ownership protocols; circular indexing alone
does not make a queue thread-safe.

## 3. What you should internalize

Ring buffers trade growth for predictable capacity. Define what full and empty
mean, what happens on overflow, and who owns each slot.

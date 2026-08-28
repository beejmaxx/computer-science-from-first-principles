# 16. Monotonic Deque — Rolling Extremes

A monotonic deque keeps candidates ordered so the minimum or maximum of every
sliding window can be produced in linear time.

## When to use it

Use it for rolling highs and lows, streaming thresholds, windowed telemetry,
and algorithms that repeatedly need an extreme over adjacent ranges.

<div class="ds-demo" data-demo="monotonic"></div>

## 1. Invariant

For a rolling maximum, stored values decrease from front to back. Before adding
a new value, remove smaller values from the back: they can never win again while
the new, later value remains in the window. Remove expired indices from the
front.

```rust
use std::collections::VecDeque;

fn rolling_max(values: &[i32], width: usize) -> Vec<i32> {
    assert!(width > 0);
    let mut candidates = VecDeque::new();
    let mut result = Vec::new();

    for index in 0..values.len() {
        while candidates.front().is_some_and(|&old| old + width <= index) {
            candidates.pop_front();
        }
        while candidates.back().is_some_and(|&old| values[old] <= values[index]) {
            candidates.pop_back();
        }
        candidates.push_back(index);
        if index + 1 >= width {
            result.push(values[*candidates.front().unwrap()]);
        }
    }
    result
}

fn main() {
    assert_eq!(rolling_max(&[1, 3, -1, -3, 5, 3, 6, 7], 3),
               vec![3, 3, 5, 5, 6, 7]);
}
```

Each index enters once and leaves once, so total work is `O(n)` rather than
`O(n × width)`. Store indices, not only values, so expiration is detectable.

## 2. What you should internalize

The deque contains only values that can still become the answer. Its ordering
invariant converts repeated window scans into amortized constant work per item.

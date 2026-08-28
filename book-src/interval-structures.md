# Interval Structures — Overlap and Range Queries

An interval represents a range such as `[start, end)`. Interval problems ask
which ranges overlap a point or another range, or how ranges can be merged.

<div class="ds-demo" data-demo="intervals"></div>

## When to use them

Use interval structures for schedules, reservations, time windows, memory
ranges, genomic regions, and price validity periods.

Start with a sorted `Vec`; add an augmented tree only when frequent dynamic
overlap queries justify the additional invariants.

## 1. The overlap rule

For half-open intervals, two ranges overlap exactly when:

```text
left.start < right.end && right.start < left.end
```

Half-open ranges make adjacent intervals non-overlapping and avoid double
counting their shared boundary.

## 2. Merge sorted intervals

```rust
fn merge(mut intervals: Vec<(i32, i32)>) -> Vec<(i32, i32)> {
    intervals.sort_unstable();
    let mut merged: Vec<(i32, i32)> = Vec::new();

    for (start, end) in intervals {
        assert!(start <= end);
        match merged.last_mut() {
            Some(last) if start < last.1 => last.1 = last.1.max(end),
            _ => merged.push((start, end)),
        }
    }
    merged
}

fn main() {
    assert_eq!(merge(vec![(5, 8), (1, 3), (2, 6), (10, 12)]),
               vec![(1, 8), (10, 12)]);
}
```

Sorting costs `O(n log n)`; the merge scan is `O(n)`.

## 3. Choosing a structure

| Workload | Structure |
|---|---|
| Static intervals, occasional query | Sorted `Vec` |
| Find by exact start | `BTreeMap<Start, ...>` |
| Many dynamic overlap queries | Interval tree |
| Assign values over numeric segments | Segment tree |
| Repeated cumulative range queries | Fenwick tree |

An interval tree augments each search-tree node with the greatest endpoint in
its subtree. That summary lets a query skip branches that cannot overlap.

## 4. Sharp edges

Choose closed, open, or half-open boundaries once and encode the choice
consistently. Decide whether empty intervals and touching ranges count as
overlap. Many interval bugs are contract bugs, not tree bugs.

## 5. What you should internalize

Start with sorted intervals and binary search. Reach for an augmented tree only
when dynamic overlap queries justify its invariants and memory cost.

## Exercise

Test the merge function with empty intervals, nested intervals, and the
half-open neighbors `[1, 3)` and `[3, 5)`. Decide explicitly whether touching
ranges should remain separate, then make the implementation match that rule.

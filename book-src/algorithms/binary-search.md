# 21. Binary Search — Finding the Boundary

Binary search repeatedly removes half of a sorted search space. Its durable
form is not “look for the target”; it is “find the first position where a
condition becomes true.”

<div class="algorithm-demo" data-algorithm-demo="binary-search">
  <div class="algorithm-demo-controls" aria-label="Binary-search controls">
    <label class="algorithm-demo-field">Target
      <select data-binary-target>
        <option value="5">5 — absent</option>
        <option value="24" selected>24 — duplicated</option>
        <option value="42">42 — present</option>
        <option value="70">70 — beyond the end</option>
      </select>
    </label>
    <button type="button" data-binary-action="step">Next comparison</button>
    <button type="button" data-binary-action="reset">Reset</button>
  </div>
  <div class="binary-search-stage">
    <div class="binary-search-array" data-binary-array role="img" aria-label="Sorted values for binary search"></div>
    <div class="binary-search-range" data-binary-range></div>
  </div>
  <p class="algorithm-demo-status" data-binary-status aria-live="polite"></p>
  <noscript>The interactive controls require JavaScript.</noscript>
</div>

## When to use binary search

Use binary search when:

- Values are sorted and indexable.
- A yes/no condition changes from false to true at one boundary.
- Each comparison can discard an entire half of the remaining candidates.
- Repeated queries justify establishing or maintaining order.

Typical questions include:

- Is this value present?
- Where should this value be inserted?
- Where does a run of equal values begin or end?
- What is the first timestamp at or after a cutoff?
- What is the smallest capacity that satisfies a feasibility test?

Do not sort a one-off input merely to perform one binary search: sorting costs
`O(n log n)`, while a linear scan costs `O(n)`. Binary search also requires
random access or another way to reach the middle efficiently.

## 1. The invariant

Use a half-open interval:

```text
[low, high)
```

At every step, the boundary is somewhere in that interval. Everything before
`low` is known to be too small. Everything at or after `high` is already known
to satisfy the condition.

The interval begins as:

```text
low = 0
high = len
```

It ends when:

```text
low == high
```

That single remaining position is the boundary. Keeping `high` exclusive makes
the empty input and an insertion after the final element ordinary cases rather
than exceptions.

## 2. Lower bound in Rust

The **lower bound** is the first index whose value is greater than or equal to
the target:

```rust
fn lower_bound(values: &[i32], target: i32) -> usize {
    let mut low = 0;
    let mut high = values.len();

    while low < high {
        let middle = low + (high - low) / 2;

        if values[middle] < target {
            low = middle + 1;
        } else {
            high = middle;
        }
    }

    low
}

fn main() {
    let values = [3, 7, 11, 18, 24, 24, 42, 57, 68];

    assert_eq!(lower_bound(&values, 2), 0);
    assert_eq!(lower_bound(&values, 24), 4);
    assert_eq!(lower_bound(&values, 25), 6);
    assert_eq!(lower_bound(&values, 70), values.len());
}
```

Every branch preserves the invariant:

- If `values[middle] < target`, the boundary must be after `middle`.
- Otherwise, `middle` might be the boundary, so it remains included by setting
  `high = middle`.

Both branches shrink the interval. That progress argument is what prevents an
infinite loop.

## 3. Exact lookup is a boundary plus a check

Once the lower bound is known, exact membership requires one safe comparison:

```rust
# fn lower_bound(values: &[i32], target: i32) -> usize {
#     let (mut low, mut high) = (0, values.len());
#     while low < high {
#         let middle = low + (high - low) / 2;
#         if values[middle] < target { low = middle + 1; } else { high = middle; }
#     }
#     low
# }
fn find(values: &[i32], target: i32) -> Option<usize> {
    let index = lower_bound(values, target);
    values.get(index).is_some_and(|&value| value == target).then_some(index)
}

fn main() {
    let values = [10, 20, 20, 30];
    assert_eq!(find(&values, 20), Some(1));
    assert_eq!(find(&values, 25), None);
}
```

This deliberately finds the first duplicate rather than merely any matching
position.

## 4. Why it is logarithmic

After each comparison, at most half of the candidates remain:

```text
n → n/2 → n/4 → n/8 → ... → 1
```

The number of halvings is `O(log n)`. Searching one billion sorted values needs
only about 30 comparisons.

The complete cost is:

| Operation | Complexity |
|---|---:|
| Search sorted slice | `O(log n)` |
| Establish order by sorting | `O(n log n)` |
| Insert into a sorted `Vec` | `O(n)` because values shift |

Binary search makes lookup cheap; it does not make maintaining sorted storage
cheap.

## 5. Common failure modes

- Mixing inclusive and exclusive bounds in one implementation.
- Updating `low = middle` when `middle` can equal `low`, preventing progress.
- Subtracting one from an unsigned zero index.
- Returning immediately on equality when the first duplicate is required.
- Forgetting that a valid insertion position can equal `len`.
- Applying the algorithm to a predicate that does not change monotonically.

Writing the invariant before writing the loop makes these bugs much easier to
see.

## 6. Big-O is not the whole machine

Binary search jumps through memory and contains a data-dependent branch. A
linear scan touches adjacent values and can be friendly to caches, prefetching,
and SIMD. For a small collection, a scan can therefore beat binary search even
though it performs more comparisons.

The practical rule is:

> Use complexity to choose plausible algorithms, then measure representative
> sizes and data on the target machine.

This relationship between an abstract cost model and actual hardware is the
bridge into the later machine-model and performance parts of the book.

## 7. What you should internalize

1. Binary search locates a boundary in a monotonic search space.
2. `[low, high)` contains every position that could still be the answer.
3. Every iteration must preserve the invariant and shrink the interval.
4. Lower bound turns exact search, insertion points, and duplicate handling
   into the same operation.
5. `O(log n)` comparisons do not guarantee the fastest result for tiny inputs.

## Exercise

Implement `upper_bound`, the first index whose value is strictly greater than
the target. Combine it with `lower_bound` to return the complete half-open range
containing every duplicate. Test empty input, missing values, all-equal values,
and targets before and after the stored range.

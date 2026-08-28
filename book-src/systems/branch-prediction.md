# Branch Prediction — When Control Flow Becomes Data-Dependent

A pipelined CPU encounters a conditional branch before it necessarily knows
which path the program will take. It predicts the outcome so useful work can
continue; a wrong prediction discards speculative work and redirects execution.

<div class="system-demo" data-system-demo="branch-prediction">
  <div class="system-demo-controls" aria-label="Branch-prediction controls">
    <label class="system-demo-field">Actual outcomes
      <select data-branch-pattern>
        <option value="grouped">Grouped</option>
        <option value="mostly-taken">Mostly taken</option>
        <option value="alternating">Alternating</option>
        <option value="mixed">Mixed</option>
      </select>
    </label>
    <button type="button" data-branch-action="step">Next branch</button>
    <button type="button" data-branch-action="run">Run pattern</button>
    <button type="button" data-branch-action="reset">Reset</button>
  </div>
  <div class="system-demo-metrics" aria-live="polite">
    <span class="system-demo-metric"><strong data-branch-count>0</strong>branches</span>
    <span class="system-demo-metric"><strong data-branch-misses>0</strong>mispredictions</span>
    <span class="system-demo-metric"><strong data-branch-accuracy>0%</strong>accuracy</span>
  </div>
  <div class="branch-predictor-states" data-branch-states aria-label="Two-bit predictor states"></div>
  <div class="branch-prediction" data-branch-prediction></div>
  <div class="branch-outcomes" data-branch-outcomes role="img" aria-label="Branch outcomes"></div>
  <p class="layout-legend"><code>T</code> taken · <code>N</code> not taken · underline indicates a misprediction</p>
  <p class="system-demo-status" data-branch-status aria-live="polite"></p>
  <noscript>The interactive controls require JavaScript.</noscript>
</div>

The simulator uses one two-bit saturating counter. States zero and one predict
not taken; states two and three predict taken. Each observed outcome moves the
counter one step toward that outcome. Real processors use multiple predictors,
branch and path histories, target prediction, and other mechanisms. The small
model teaches adaptation and hysteresis without pretending to reproduce a
particular CPU.

## When branch behavior matters

Branch behavior becomes relevant when:

- A small loop executes the same conditional millions of times.
- Outcomes depend on irregular input data.
- Profiling attributes meaningful stalls or branch misses to the loop.
- Validation, parsing, filtering, or dispatch dominates the critical path.
- A latency-sensitive operation has little independent work to hide recovery.

Do not eliminate every `if`. Predictable branches can be inexpensive, and a
branchless replacement can perform more instructions, more loads, or more work
on both paths. Begin with clear control flow and optimize measured hotspots.

## 1. Why prediction exists

Modern high-performance cores overlap and reorder work from multiple
instructions. A conditional branch creates two possible future instruction
streams:

```text
condition
   ├─ true path
   └─ false path
```

Waiting for every condition to resolve before fetching later instructions
would leave execution resources idle. The processor predicts a path and works
ahead. When correct, much of that work remains useful. When wrong, younger
speculative work is abandoned and the correct path must be supplied.

The recovery cost is not one universal number. It depends on the processor,
the surrounding dependency chain, available parallel work, and how early the
condition becomes known.

## 2. A two-bit predictor

One bit would reverse its prediction after a single unusual outcome. A two-bit
counter adds hysteresis:

```text
0  strongly not taken
1  weakly not taken
2  weakly taken
3  strongly taken
```

For a taken outcome:

```text
state = min(3, state + 1)
```

For a not-taken outcome:

```text
state = max(0, state - 1)
```

A predictor in a strong state needs two consecutive contrary outcomes before
its predicted direction changes. That resists occasional noise while still
adapting when behavior changes.

## 3. Patterns are easier or harder to predict

### Grouped outcomes

```text
N N N N N N T T T T T T
```

The predictor stabilizes, misses near the transition, then stabilizes again.

### Mostly one direction

```text
T T T N T T T T N T T T
```

Occasional exceptions may cause isolated misses without changing the long-term
prediction.

### Alternating outcomes

```text
T N T N T N T N T N T N
```

The simple counter has too little history to recognize alternation. More
sophisticated predictors can learn patterns that this model cannot.

The durable lesson is not that one data ordering is always fastest. It is that
the sequence of outcomes—not merely the number of branches—affects prediction.

## 4. Ordinary code produces data-dependent branches

Consider a threshold count:

```rust
fn count_at_or_above(values: &[u32], threshold: u32) -> usize {
    let mut count = 0;

    for &value in values {
        if value >= threshold {
            count += 1;
        }
    }

    count
}

fn main() {
    let grouped = [1, 2, 3, 4, 90, 91, 92, 93];
    let mixed = [1, 90, 2, 91, 3, 92, 4, 93];

    assert_eq!(count_at_or_above(&grouped, 50), 4);
    assert_eq!(count_at_or_above(&mixed, 50), 4);
}
```

Both inputs perform the same comparisons and have the same big-O complexity.
Their branch outcome sequences differ. Whether that produces a material timing
difference depends on the compiled instructions and target processor.

Compilers can sometimes convert simple conditions into conditional moves,
masks, or vector operations. Source-level `if` does not prove that the final
machine code contains a hard-to-predict branch.

## 5. Branchless is a tradeoff, not a goal

A programmer might express the count as arithmetic on a boolean:

```rust
fn count_at_or_above(values: &[u32], threshold: u32) -> usize {
    values
        .iter()
        .map(|&value| usize::from(value >= threshold))
        .sum()
}

fn main() {
    assert_eq!(count_at_or_above(&[1, 90, 2, 91], 50), 2);
}
```

This source shape may encourage a non-branching implementation, but the
compiler and target architecture decide the emitted instructions. Even truly
branchless code is not automatically faster:

- It may execute work that a correct branch would skip.
- It can lengthen a dependency chain.
- It may need extra masks, moves, or loads.
- Computing both paths can be unsafe when one path must not access invalid data.
- Predictable control flow may already perform well.

Treat branchless transformation as a hypothesis to compile, inspect, and
measure—not as a stylistic improvement.

## 6. Changing data order has a cost

Grouping similar outcomes can improve predictability, but rearranging input may
require sorting, buffering, or extra latency. It may also violate semantic order
or make another stage's locality worse.

Batching is valuable when the system naturally permits it. For example, a
pipeline may classify a batch once and then process homogeneous groups. A
single-record latency path may not have that freedom.

Optimization must include the cost and correctness constraints of producing the
new order, not only the speed of the final loop.

## 7. Measuring branch effects

Useful evidence can include:

- Optimized machine code for the hot loop.
- Hardware performance counters for retired branches and branch misses.
- A benchmark using representative outcome distributions.
- End-to-end latency distributions, not only loop throughput.
- Tests across the actual deployment CPUs and compiler configuration.

Avoid benchmarks whose inputs are constant enough for the compiler to remove
the work or whose tiny data set accidentally measures one predictor warm-up
instead of steady behavior.

## 8. What you should internalize

1. Prediction lets a pipelined core continue before a branch resolves.
2. A wrong prediction discards speculative work and redirects execution.
3. Outcome sequences influence predictability.
4. A two-bit counter demonstrates adaptation and hysteresis, not a modern CPU's
   complete predictor.
5. Source-level branches may compile into other forms.
6. Branchless code can do more work and is not universally faster.
7. Optimize only after inspecting and measuring the actual hot path.

## Exercise

Start the two-bit predictor in state one and trace the outcomes
`T, T, N, T, N, N, N`. Record the prediction, correctness, and next state for
each outcome. Then design a different seven-outcome sequence that causes more
mispredictions without changing the number of taken outcomes.

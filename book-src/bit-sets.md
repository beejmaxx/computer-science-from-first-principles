# Bit Sets — Dense Membership

A bit set represents membership with one bit per possible integer value.

<div class="ds-demo" data-demo="bit-set"></div>

## When to use it

Use a bit set when the universe is bounded and densely numbered: permissions,
CPU sets, feature flags, graph visitation, instrument IDs, or compact set
algebra. Use `HashSet` for sparse or non-integer keys.

## 1. Representation

One `u64` stores membership for 64 values:

```text
word = value / 64
bit  = value % 64
mask = 1 << bit
```

## 2. Small implementation

```rust
#[derive(Clone, Debug, PartialEq)]
struct BitSet {
    words: Vec<u64>,
}

impl BitSet {
    fn with_capacity(bits: usize) -> Self {
        Self { words: vec![0; bits.div_ceil(64)] }
    }

    fn insert(&mut self, value: usize) {
        let (word, bit) = (value / 64, value % 64);
        self.words[word] |= 1_u64 << bit;
    }

    fn remove(&mut self, value: usize) {
        let (word, bit) = (value / 64, value % 64);
        self.words[word] &= !(1_u64 << bit);
    }

    fn contains(&self, value: usize) -> bool {
        let (word, bit) = (value / 64, value % 64);
        self.words.get(word).is_some_and(|bits| bits & (1_u64 << bit) != 0)
    }

    fn intersection(&self, other: &Self) -> Self {
        Self {
            words: self.words.iter().zip(&other.words)
                .map(|(left, right)| left & right).collect(),
        }
    }

    fn len(&self) -> u32 {
        self.words.iter().map(|word| word.count_ones()).sum()
    }
}

fn main() {
    let mut left = BitSet::with_capacity(128);
    left.insert(3);
    left.insert(70);

    let mut right = BitSet::with_capacity(128);
    right.insert(3);
    right.insert(90);

    assert!(left.contains(70));
    assert_eq!(left.intersection(&right).len(), 1);
    left.remove(3);
    assert!(!left.contains(3));
}
```

Membership updates are `O(1)`. Union and intersection process one machine word
at a time in `O(universe / word_size)` and are often vectorizable.

## 3. Tradeoffs

A million possible IDs require about 125 KB regardless of how many are present.
That is excellent when many IDs occur and wasteful when only a handful do.
Bounds policy is part of the API: the example panics when inserting beyond its
declared capacity but safely returns `false` for an out-of-range lookup.

## 4. What you should internalize

Bit sets are arrays of membership bits. They provide compact dense membership
and extremely fast bulk set operations, but require a bounded integer domain.

## Exercise

Add `union`, `difference`, and `count` operations to the example. Test values on
both sides of a word boundary, such as `63`, `64`, and `65`.

# 14. Bloom Filters — Probabilistic Membership

A Bloom filter is a compact probabilistic set. It can prove that a value is
definitely absent or report that it is possibly present.

<div class="ds-demo" data-demo="bloom"></div>

## When to use it

Use a Bloom filter to avoid expensive negative lookups—for example, before disk,
network, or database access. Do not use it when false positives are unacceptable
or when stored values must be retrieved.

> “Not present” is definitive; “possibly present” requires confirmation.

## 1. Mental model

Insertion hashes a value several ways and sets several bits. Lookup checks the
same positions:

```text
insert(x): set bits h1(x), h2(x), h3(x)
lookup(x): if any bit is zero → definitely absent
           if all are one    → possibly present
```

Collisions can make an absent value appear present. A standard Bloom filter has
no false negatives as long as bits are never cleared.

## 2. Small implementation

```rust
use std::collections::hash_map::DefaultHasher;
use std::hash::{Hash, Hasher};

struct BloomFilter {
    bits: Vec<bool>,
    hashes: u64,
}

impl BloomFilter {
    fn new(bit_count: usize, hashes: u64) -> Self {
        assert!(bit_count > 0 && hashes > 0);
        Self { bits: vec![false; bit_count], hashes }
    }

    fn index<T: Hash>(&self, value: &T, seed: u64) -> usize {
        let mut hasher = DefaultHasher::new();
        seed.hash(&mut hasher);
        value.hash(&mut hasher);
        hasher.finish() as usize % self.bits.len()
    }

    fn insert<T: Hash>(&mut self, value: &T) {
        for seed in 0..self.hashes {
            let index = self.index(value, seed);
            self.bits[index] = true;
        }
    }

    fn might_contain<T: Hash>(&self, value: &T) -> bool {
        (0..self.hashes).all(|seed| self.bits[self.index(value, seed)])
    }
}

fn main() {
    let mut filter = BloomFilter::new(1_024, 4);
    filter.insert(&"alice");
    filter.insert(&"bob");

    assert!(filter.might_contain(&"alice"));
    // A false positive is possible, so do not assert that an absent key is false.
}
```

The example teaches the structure; production implementations use carefully
chosen hash derivation and bit storage.

## 3. Sizing

False positives increase when too many values share too few bits. For `n`
expected values and desired false-positive probability `p`, common estimates
are:

```text
bits ≈ -n ln(p) / (ln 2)²
hashes ≈ (bits / n) ln 2
```

Measure the realized rate with representative data.

## 4. Limitations

- It does not store or return the original values.
- Ordinary deletion can create false negatives; counting Bloom filters replace
  bits with counters when deletion is required.
- Capacity mistakes degrade accuracy rather than producing an obvious error.
- The hash scheme and parameters are part of persisted-format compatibility.

## 5. What you should internalize

A Bloom filter is a fast negative filter, not a source of truth. It trades a
controlled false-positive rate for compact storage and cheap membership tests.

## Exercise

Insert 1,000 values, test 10,000 different values, and measure the observed
false-positive rate. Repeat with twice as many bits while keeping the number of
hashes fixed.

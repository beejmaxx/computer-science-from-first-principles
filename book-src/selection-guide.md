# Data-Structure Selection Guide

Choose a data structure from the operation that must be cheap, not from its
name or theoretical reputation.

## Ordered sequences

| Need | Start with |
|---|---|
| Indexed sequence, stack, contiguous slice | `Vec` |
| Queue or active operations at both ends | `VecDeque` |
| Fixed-capacity streaming | Ring buffer |
| Node-based links or whole-list joining | `LinkedList` |
| Rolling minimum or maximum | Monotonic deque |

## Keys, membership, and order

| Need | Start with |
|---|---|
| Key to value, order irrelevant | `HashMap` |
| Unique membership, order irrelevant | `HashSet` |
| Key to value with ranges and sorting | `BTreeMap` |
| Unique membership with ranges and sorting | `BTreeSet` |
| Dense bounded integer membership | Bit set |
| Compact negative membership filter | Bloom filter |
| Prefix lookup | Trie |

## Priority, identity, and relationships

| Need | Start with |
|---|---|
| Repeated greatest or smallest item | `BinaryHeap` |
| Change arbitrary priorities | Indexed priority queue |
| Stable IDs with slot reuse | Generational arena |
| Arbitrary relationships | Adjacency-list graph |
| Connectivity under edge additions | Union-find |
| Lookup plus recency | LRU composition |
| Dynamic overlap queries | Interval tree |

## Questions to ask

1. Is access by position, key, priority, range, prefix, identity, or recency?
2. Which operations dominate, and what are their required bounds?
3. Is order semantic or merely convenient for display?
4. Is the domain dense or sparse?
5. Are identities stable across removal and reuse?
6. Must memory be bounded?
7. Does contiguous layout outweigh asymptotic differences?
8. What invariant must every mutation preserve?
9. Can a simpler structure meet the measured workload?

## Final rule

> Prefer the simplest representation whose invariants make the required
> operations cheap enough—and verify the decision with realistic measurements.

# Mutexes, Reader-Writer Locks, and Condition Variables

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Concurrency</span></p>

Locks protect invariants, not merely variables. Their behavior depends on contention, critical-section length, wake-up policy, and the code executed while held.

## Planned model

Schedule readers and writers around mutexes, reader-writer locks, and condition variables. Show queues, ownership, spurious wake-ups, convoying, and wait time.

## Questions

- What exact invariant does the lock protect?
- When can a reader-writer lock perform worse than a mutex?
- Why must a condition predicate be checked in a loop?

## Exercise

Design a bounded blocking queue and specify the predicates, lock boundaries, and notifications for every state transition.

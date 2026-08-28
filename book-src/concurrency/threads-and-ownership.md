# Threads, Ownership Transfer, and Shared State

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Concurrency</span></p>

Concurrency begins with deciding who owns each piece of state and how ownership or observations move between execution contexts.

## Planned model

Pass messages and shared objects among threads while displaying ownership, aliases, synchronization edges, and illegal races.

## Questions

- Can state be partitioned instead of shared?
- What does a successful handoff guarantee about prior writes?
- Which Rust traits prevent unsafe cross-thread movement or access?

## Exercise

Assign ownership for every buffer and mutable field in a three-stage pipeline, including shutdown and error paths.

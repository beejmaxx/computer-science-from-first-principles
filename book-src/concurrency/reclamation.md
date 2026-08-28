# RCU, Epochs, and Memory Reclamation

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Concurrency</span></p>

Removing an object from a shared structure does not prove that no reader can still reach it. Reclamation determines when its storage may be reused.

## Planned model

Track readers, retired nodes, epochs, grace periods, and reclamation. Contrast reference counting, hazard pointers, epochs, and read-copy-update.

## Questions

- What event proves that every old reader has finished?
- How can a stalled participant delay reclamation?
- Which problem is the ABA pattern exposing?

## Exercise

Specify a safe lifecycle for removing and eventually freeing a node that lock-free readers may already hold.

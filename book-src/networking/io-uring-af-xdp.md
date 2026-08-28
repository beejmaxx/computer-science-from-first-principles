# `io_uring` and AF_XDP

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Networking and I/O</span></p>

These are different mechanisms. `io_uring` is an asynchronous kernel I/O
interface; it does not generally bypass the kernel. AF_XDP exposes a fast packet
path through XDP and shared rings while retaining kernel participation. DPDK's
poll-mode drivers are the book's primary example of userspace NIC access that
bypasses the ordinary kernel network stack.

## Planned model

Compare conventional sockets, `io_uring`, AF_XDP, and DPDK. Show submissions,
completions, copies, wake-ups, ownership, setup cost, and which kernel work
remains in each path.

## Questions

- Which kernel work remains in each path?
- Who owns a registered buffer at every instant?
- When does operational complexity outweigh saved overhead?

## Exercise

Draw the lifecycle of one receive buffer from NIC arrival through application processing and safe reuse.

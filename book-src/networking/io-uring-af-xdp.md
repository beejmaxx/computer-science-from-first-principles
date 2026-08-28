# `io_uring`, AF_XDP, and Kernel Bypass

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Networking and I/O</span></p>

Shared rings, registered resources, and direct packet paths reduce syscall and kernel-network-stack work while imposing stricter buffer and queue management.

## Planned model

Compare conventional sockets, `io_uring`, AF_XDP, and a conceptual bypass path. Show submissions, completions, copies, wake-ups, ownership, and setup cost.

## Questions

- Which kernel work remains in each path?
- Who owns a registered buffer at every instant?
- When does operational complexity outweigh saved overhead?

## Exercise

Draw the lifecycle of one receive buffer from NIC arrival through application processing and safe reuse.

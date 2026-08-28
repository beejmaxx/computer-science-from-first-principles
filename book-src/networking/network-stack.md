# Ethernet, IP, UDP, TCP, and Multicast

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Networking and I/O</span></p>

Each network layer adds addressing, framing, delivery semantics, and failure modes. Applications must know which guarantees exist and which they must supply.

## Planned model

Encapsulate an application message through Ethernet, IP, and transport headers, then inject loss, reordering, duplication, fragmentation, and retransmission.

## Questions

- Which layer detects corruption, loss, or ordering problems?
- When is UDP or multicast preferable to a reliable byte stream?
- Why can TCP preserve bytes while obscuring message boundaries?

## Exercise

Specify the framing and recovery responsibilities of an application protocol over both TCP and UDP.

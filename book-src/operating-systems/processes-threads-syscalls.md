# Processes, Threads, and System Calls

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Operating Systems and Execution</span></p>

Processes isolate resources; threads share an address space; system calls cross into the kernel to request privileged work.

## Planned model

Trace one operation through user code, a syscall boundary, kernel work, blocking, wake-up, and return. Show which state belongs to the process, thread, and kernel.

## Questions

- What is shared by threads and what remains per-thread?
- Which ordinary-looking operations can enter the kernel or block?
- What must be saved during an execution-context switch?

## Exercise

Trace the complete state and privilege transitions for reading from a socket whose receive queue is initially empty.

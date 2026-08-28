# Templates, Inlining, and Code Size

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> High-Performance C++</span></p>

Templates can remove abstraction overhead and enable specialization, but more
instantiations and aggressive inlining can increase compile time, binary size,
and instruction-cache pressure.

## Planned model

Compare virtual dispatch, function objects, templates, and explicit branches.
Inspect the optimized assembly and measure both steady-state work and code size.

## Questions

- Did the abstraction disappear in the generated code?
- Did specialization duplicate a hot path or create instruction-cache pressure?
- Is link-time optimization changing the conclusion?

## Exercise

Implement one packet handler with runtime and compile-time dispatch, then make a
claim supported by assembly and benchmark evidence.

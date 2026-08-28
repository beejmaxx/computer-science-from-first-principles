# High-Performance C++

<p class="chapter-meta"><span><strong>Status</strong> Draft</span></p>

This applied track connects modern C++ to the machine and performance models in
the rest of the book. It is not a tour of language syntax. It concentrates on
the choices that change correctness, layout, allocation, generated code,
contention, and latency.

Rust and C++ will share experiment specifications rather than matching line for
line. The useful question is not which language wins in the abstract, but which
costs each implementation creates under a stated compiler, machine, and load.

The track covers object lifetime, layout and invalidation, allocation strategies,
templates and code size, the C++ memory model, sanitizers, compiler inspection,
and reproducible benchmarking.

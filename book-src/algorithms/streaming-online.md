# Streaming and Online Algorithms

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Essential Algorithms</span></p>

An online algorithm must act before the full input is known; a streaming algorithm must usually do so with bounded memory.

## Planned model

Feed an adjustable stream into exact counters, reservoir sampling, sketches, and online statistics. Show memory use and approximation error as data arrives.

## Questions

- Which exact state must grow with the number of distinct values?
- What error guarantee does an approximation provide?
- How do event time, arrival time, and late data affect the result?

## Exercise

Estimate a percentile or distinct count under a fixed memory budget and state precisely what accuracy is sacrificed.

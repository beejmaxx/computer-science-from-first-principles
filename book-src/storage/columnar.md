# Columnar Layouts and Vectorized Execution

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Storage and Database Internals</span></p>

Columnar storage places values of the same field together, enabling projection, compression, SIMD-friendly scans, and late materialization.

## Planned model

Execute the same filter and aggregate over row and column layouts. Count bytes loaded, cache lines, decoded values, branches, and vector lanes.

## Questions

- Which workload needs whole records and which needs a few columns?
- How do nulls and variable-length values alter the layout?
- When does compression improve speed by reducing memory traffic?

## Exercise

Design a column representation for timestamp, symbol, price, quantity, and optional venue fields.

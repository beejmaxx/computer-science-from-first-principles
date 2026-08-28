# Integer and Floating-Point Representation

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> The Machine</span></p>

Bits acquire meaning only through an agreed representation. That choice determines range, rounding, overflow, exceptional values, and comparison behavior.

## Planned model

Let the reader edit a bit pattern and interpret it as unsigned, two's-complement, fixed-point, and IEEE-754 data. Expose sign, exponent, fraction, rounding, and overflow.

## Questions

- Why is decimal money commonly represented with scaled integers?
- When does wrapping, checked, saturating, or overflowing arithmetic fit?
- Why are `NaN`, signed zero, and non-associativity operational concerns?

## Exercise

Choose a representation for prices and quantities, including scale, maximum range, rounding policy, and overflow handling.

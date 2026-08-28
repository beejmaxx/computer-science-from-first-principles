# Scans, Two Pointers, and Sliding Windows

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Essential Algorithms</span></p>

Many linear-looking problems become truly linear once each boundary moves in only one direction.

## Planned model

Move left and right cursors over one array while displaying the active invariant, elements entering or leaving the window, and the number of visits per element.

## Questions

- What condition lets a pointer advance without later retreating?
- When does a window need a deque, counter map, or running aggregate?
- How do time-based windows differ from fixed-length windows?

## Exercise

Maintain the maximum and total of the most recent `n` samples without rescanning the window after every arrival.

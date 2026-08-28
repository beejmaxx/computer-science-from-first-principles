# Time-Series Storage and Append-Only Logs

<p class="chapter-meta"><span><strong>Status</strong> Draft outline</span><span><strong>Section</strong> Storage and Database Internals</span></p>

Time-ordered data favors append, segmentation, compression, retention, and sequential replay, but corrections and out-of-order events complicate the model.

## Planned model

Append events into segments, build sparse indexes, rotate files, compress blocks, apply retention, and introduce late or corrected records.

## Questions

- Which ordering key defines the log?
- How are segment boundaries and indexes selected?
- Are corrections rewritten, overlaid, or represented as later events?

## Exercise

Specify an append-only event format that supports crash recovery, replay, retention, and schema evolution.

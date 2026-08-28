# Virtual Memory — Pages, Page Tables, and the TLB

A program uses virtual addresses. Before the CPU can access memory, each virtual
address must be translated into a physical location. Page tables define the
mapping; the translation lookaside buffer caches recently used translations.

<div class="system-demo" data-system-demo="virtual-memory">
  <div class="system-demo-controls" aria-label="Virtual-memory controls">
    <label class="system-demo-field">Virtual-page pattern
      <select data-vm-pattern>
        <option value="one-page">One hot page</option>
        <option value="streaming-pages">Two accesses per page</option>
        <option value="working-set">Three-page working set</option>
        <option value="thrashing">Four pages, three TLB entries</option>
      </select>
    </label>
    <button type="button" data-vm-action="step">Translate next</button>
    <button type="button" data-vm-action="run">Run pattern</button>
    <button type="button" data-vm-action="reset">Reset</button>
  </div>
  <div class="system-demo-metrics" aria-live="polite">
    <span class="system-demo-metric"><strong data-vm-accesses>0</strong>translations</span>
    <span class="system-demo-metric"><strong data-vm-hits>0</strong>TLB hits</span>
    <span class="system-demo-metric"><strong data-vm-walks>0</strong>page-table walks</span>
  </div>
  <div class="vm-translation">
    <div class="vm-translation-stage" data-vm-virtual></div>
    <span class="vm-arrow" aria-hidden="true">→</span>
    <div class="vm-translation-stage" data-vm-lookup></div>
    <span class="vm-arrow" aria-hidden="true">→</span>
    <div class="vm-translation-stage" data-vm-physical></div>
  </div>
  <div class="vm-tables">
    <div class="vm-table-panel">
      <div class="vm-table-title">TLB · three entries · LRU → MRU</div>
      <div class="vm-table-entries" data-vm-tlb></div>
    </div>
    <div class="vm-table-panel">
      <div class="vm-table-title">Page table · every page resident</div>
      <div class="vm-table-entries" data-vm-page-table></div>
    </div>
  </div>
  <div class="vm-access-sequence" data-vm-sequence role="img" aria-label="Virtual-page access sequence"></div>
  <p class="layout-legend">filled = TLB hit · underline = page-table walk</p>
  <p class="system-demo-status" data-vm-status aria-live="polite"></p>
  <noscript>The interactive controls require JavaScript.</noscript>
</div>

The simulator uses five virtual pages, conceptual 4 KiB pages, a three-entry
fully associative TLB with least-recently-used replacement, and a one-level page
table. Every page is already resident in memory. Real systems use architecture-
specific page sizes, multi-level tables, multiple TLBs, set associativity, and
more complex replacement behavior.

## When virtual-memory behavior matters

Translation becomes relevant when:

- A hot loop touches a large number of pages.
- Access jumps unpredictably across a large working set.
- Tail latency is sensitive to first-touch page faults.
- Threads migrate between cores and lose core-local translation state.
- Huge pages, memory locking, or NUMA placement are being considered.
- Profiling reports translation misses, page walks, or page faults.

Do not tune page behavior from folklore. Page size, TLB structure, operating-
system policy, and available counters vary by platform. Measure the deployed
hardware and workload.

## 1. Virtual addresses separate programs from physical placement

Each process operates in a virtual address space. The same virtual address in
two processes can refer to different physical memory. The operating system and
hardware use page tables to establish mappings and permissions.

Virtual memory enables:

- Isolation between processes.
- Per-page read, write, and execute permissions.
- Sparse address spaces.
- Shared mappings when explicitly configured.
- Moving or replacing physical storage without changing every program pointer.

The abstraction is powerful, but every memory access still needs a translation.

## 2. Split an address into page number and offset

For a power-of-two page size, a virtual address divides into:

```text
virtual address = virtual page number | offset within page
```

With a conceptual 4 KiB page:

```text
virtual_page = address / 4096
offset       = address % 4096
```

The page table maps the virtual page number to a physical frame number. The
offset does not change:

```text
VPN 2 + offset 192
    ↓ page-table mapping
frame 7 + offset 192
```

Translation changes which page-sized frame is used, not the position within
that frame.

## 3. Page tables are too expensive to consult naively

Page tables live in memory and are commonly hierarchical. Walking them can
require several dependent memory references before the original load or store
can be completed.

If every ordinary access performed a full page-table walk, translation would
dominate execution. Hardware therefore caches translations in the **translation
lookaside buffer**, or **TLB**.

Conceptually:

```text
virtual page ──TLB hit──────────────▶ physical frame
             └─TLB miss─▶ page table ─▶ physical frame + cache translation
```

A TLB hit avoids the walk. A TLB miss does not mean that the requested data is
absent from physical memory.

## 4. A TLB miss is not a page fault

These events answer different questions:

| Event | Meaning |
|---|---|
| TLB hit | Translation was cached |
| TLB miss | Translation must be recovered from another translation structure |
| Page-table walk | Hardware or software reads page-table entries |
| Page fault | The mapping needs operating-system handling |

A page can be fully resident and still miss in the TLB. The page-table walk
finds a valid mapping, fills the TLB, and retries or completes the access.

A page fault transfers control to the operating system. Some faults establish
a mapping for an already available physical page; others may require allocating,
zeroing, copying, or obtaining data from storage. Their cost and behavior differ
dramatically.

## 5. Translation has a working set

The TLB can cover only a finite number of pages at once. A loop whose active
pages fit can warm its translations and reuse them. A loop cycling through more
pages than the relevant TLB can hold may repeatedly replace entries.

The amount of virtual memory covered by a TLB is often called its **reach**:

```text
TLB reach ≈ number of usable entries × page size
```

This is a conceptual estimate. Multiple page sizes, associativity, conflicts,
and separate instruction/data structures complicate actual coverage.

## 6. Data layout affects translation too

Cache locality asks whether useful bytes share cache lines. Translation locality
asks whether useful addresses share pages whose mappings remain cached.

A contiguous batch can provide both:

- Neighboring values reuse cache lines.
- Many accesses reuse one page translation.
- Sequential page crossings can be predictable.

A large pointer-linked structure can scatter nodes across many pages. That may
increase cache misses and translation misses together. Allocation policy and
data layout therefore influence more than one level of the machine.

## 7. First touch and prefaulting

Reserving virtual address space does not necessarily mean every page already
has private physical storage behind it. The first access can trigger mapping,
allocation, or zeroing work depending on the operating system and allocation.

A latency-sensitive service may deliberately initialize and touch its working
memory before entering the critical path. That moves predictable setup work out
of later requests. It does not guarantee that pages can never fault again, and
the exact behavior remains platform-specific.

This function touches one byte per caller-supplied page interval:

```rust
fn touch_each_page(bytes: &mut [u8], page_size: usize) {
    assert!(page_size > 0);
    for index in (0..bytes.len()).step_by(page_size) {
        bytes[index] = bytes[index].wrapping_add(1);
    }
}

fn main() {
    let mut storage = vec![0_u8; 16 * 1024];
    touch_each_page(&mut storage, 4096);
    assert_eq!(storage[0], 1);
    assert_eq!(storage[4096], 1);
    assert_eq!(storage[8192], 1);
    assert_eq!(storage[12288], 1);
}
```

The page size is an input because production code should obtain platform facts
deliberately rather than assume the book's conceptual size.

## 8. Huge pages trade granularity for reach

Larger pages let one TLB entry cover more memory. They can reduce translation
pressure for large, stable working sets. They also increase allocation
granularity and can complicate availability, fragmentation, startup, deployment,
and memory waste.

Huge pages are not a universal low-latency switch. They are an operational and
measurement decision with platform-specific configuration and failure modes.

## 9. Memory locking and CPU pinning solve different problems

Memory locking aims to keep selected mappings resident according to operating-
system policy. CPU affinity constrains where a thread may run. Neither action
automatically provides the other:

- Pinning a thread does not ensure all of its pages are resident.
- Locking memory does not keep a thread on one core.
- Both can still leave cache, TLB, NUMA, interrupt, and scheduling effects.

Later chapters treat memory locking, NUMA placement, scheduling, and CPU
isolation as separate mechanisms that must be designed together.

## 10. What you should internalize

1. Programs issue virtual addresses; hardware translates them to physical
   locations.
2. The page offset remains unchanged during translation.
3. Page tables define mappings and permissions.
4. The TLB caches page translations.
5. A TLB miss can cause a page-table walk without causing a page fault.
6. Translation has a finite working set just as data caches do.
7. Contiguous layouts can improve cache-line and page-translation locality.
8. First touch, huge pages, locking, and affinity are distinct mechanisms.
9. Platform measurements must guide low-level memory policy.

## Exercise

Using a three-entry fully associative TLB initially empty, trace the virtual-page
sequence `0, 1, 2, 0, 3, 0, 1, 2`. Apply least-recently-used replacement and
record every hit, walk, and eviction. Then repeat with four entries and explain
which behavior changes and which does not.

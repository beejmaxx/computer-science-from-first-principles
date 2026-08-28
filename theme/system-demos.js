(() => {
  const patterns = {
    sequential: Array.from({ length: 24 }, (_, index) => index),
    strided: Array.from({ length: 24 }, (_, index) => (index * 5) % 24),
    "pointer-chase": [0, 13, 2, 19, 7, 22, 4, 16, 10, 1, 14, 6, 21, 9, 17, 3, 20, 8, 23, 5, 12, 18, 11, 15],
  };

  const descriptions = {
    sequential: "Sequential access consumes every record in a loaded line before moving on.",
    strided: "A stride jumps between lines and often evicts a line before its neighboring records are used.",
    "pointer-chase": "The next address depends on the current record, limiting look-ahead and prefetching.",
  };

  function initializeMemoryHierarchy(root) {
    const patternInput = root.querySelector("[data-memory-pattern]");
    const memory = root.querySelector("[data-memory-lines]");
    const cacheContents = root.querySelector("[data-cache-contents]");
    const status = root.querySelector("[data-memory-status]");
    const historyElement = root.querySelector("[data-memory-history]");
    const accessesElement = root.querySelector("[data-memory-accesses]");
    const hitsElement = root.querySelector("[data-memory-hits]");
    const missesElement = root.querySelector("[data-memory-misses]");
    const stepButton = root.querySelector('[data-memory-action="step"]');
    const runButton = root.querySelector('[data-memory-action="run"]');
    const resetButton = root.querySelector('[data-memory-action="reset"]');

    let sequence;
    let cursor;
    let cache;
    let hits;
    let misses;
    let currentIndex;
    let history;
    let timer = null;

    const lineOf = (index) => Math.floor(index / 4);

    function render(message) {
      const nextIndex = cursor < sequence.length ? sequence[cursor] : null;
      const currentLine = currentIndex === null ? null : lineOf(currentIndex);

      memory.innerHTML = Array.from({ length: 6 }, (_, line) => {
        const lineClasses = ["memory-line"];
        if (cache.includes(line)) lineClasses.push("is-cached");
        if (line === currentLine) lineClasses.push("is-current");

        const records = Array.from({ length: 4 }, (_, offset) => {
          const index = line * 4 + offset;
          const recordClasses = ["memory-record"];
          if (index === currentIndex) recordClasses.push("is-current");
          if (index === nextIndex) recordClasses.push("is-next");
          return `<span class="${recordClasses.join(" ")}">${index}</span>`;
        }).join("");

        return `<div class="${lineClasses.join(" ")}"><div class="memory-line-label">line ${line} · 64 B</div><div class="memory-records">${records}</div></div>`;
      }).join("");

      cacheContents.innerHTML = Array.from({ length: 3 }, (_, slot) => {
        const line = cache[slot];
        return line === undefined
          ? '<span class="cache-slot is-empty">empty</span>'
          : `<span class="cache-slot">line ${line}</span>`;
      }).join("");

      accessesElement.textContent = String(cursor);
      hitsElement.textContent = String(hits);
      missesElement.textContent = String(misses);
      historyElement.textContent = history.length
        ? `recent records: ${history.slice(-10).join(" → ")}`
        : "recent records: —";
      status.textContent = message || descriptions[patternInput.value];

      const done = cursor >= sequence.length;
      stepButton.disabled = done || timer !== null;
      runButton.disabled = done || timer !== null;
      patternInput.disabled = timer !== null;
      memory.setAttribute("aria-label", `Six conceptual memory lines. Cache currently contains ${cache.length ? cache.map((line) => `line ${line}`).join(", ") : "no lines"}.`);
    }

    function accessNext() {
      if (cursor >= sequence.length) return false;
      currentIndex = sequence[cursor];
      const line = lineOf(currentIndex);
      const cachedAt = cache.indexOf(line);
      let message;

      if (cachedAt >= 0) {
        hits += 1;
        cache.splice(cachedAt, 1);
        cache.push(line);
        message = `Record ${currentIndex} is in cached line ${line}: hit.`;
      } else {
        misses += 1;
        const evicted = cache.length === 3 ? cache.shift() : null;
        cache.push(line);
        message = evicted === null
          ? `Record ${currentIndex} loads line ${line}: miss.`
          : `Record ${currentIndex} loads line ${line}: miss, evicting line ${evicted}.`;
      }

      cursor += 1;
      history.push(currentIndex);
      if (cursor === sequence.length) {
        message += ` Finished with ${hits} hits and ${misses} misses in this simplified cache.`;
      }
      render(message);
      return cursor < sequence.length;
    }

    function stopRun() {
      const message = status.textContent;
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
      render(message);
    }

    function reset() {
      if (timer !== null) clearInterval(timer);
      timer = null;
      sequence = patterns[patternInput.value];
      cursor = 0;
      cache = [];
      hits = 0;
      misses = 0;
      currentIndex = null;
      history = [];
      render();
    }

    stepButton.addEventListener("click", accessNext);
    runButton.addEventListener("click", () => {
      if (timer !== null || cursor >= sequence.length) return;
      timer = setInterval(() => {
        if (!accessNext()) stopRun();
      }, 240);
      render("Running the selected access pattern…");
    });
    resetButton.addEventListener("click", reset);
    patternInput.addEventListener("change", reset);
    reset();
  }

  function initialize() {
    document.querySelectorAll('[data-system-demo="memory-hierarchy"]')
      .forEach(initializeMemoryHierarchy);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();

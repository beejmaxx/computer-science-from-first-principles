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

  function initializeDataLayout(root) {
    const fieldNames = { P: "price", S: "size", T: "timestamp" };
    const layoutInput = root.querySelector("[data-layout-kind]");
    const workloadInput = root.querySelector("[data-layout-workload]");
    const memory = root.querySelector("[data-layout-memory]");
    const status = root.querySelector("[data-layout-status]");
    const recordsElement = root.querySelector("[data-layout-records]");
    const linesElement = root.querySelector("[data-layout-lines]");
    const efficiencyElement = root.querySelector("[data-layout-efficiency]");
    const stepButton = root.querySelector('[data-layout-action="step"]');
    const runButton = root.querySelector('[data-layout-action="run"]');
    const resetButton = root.querySelector('[data-layout-action="reset"]');

    let entries;
    let cursor;
    let accessed;
    let loadedLines;
    let currentKeys;
    let timer = null;

    const keyOf = (field, record) => `${field}${record}`;
    const workloadFields = () => workloadInput.value === "price"
      ? ["P"]
      : ["P", "S", "T"];

    function makeEntries() {
      const result = [];
      if (layoutInput.value === "aos") {
        for (let record = 0; record < 8; record += 1) {
          for (const field of ["P", "S", "T"]) result.push({ field, record });
        }
      } else {
        for (const field of ["P", "S", "T"]) {
          for (let record = 0; record < 8; record += 1) result.push({ field, record });
        }
      }
      return result;
    }

    function render(message) {
      memory.innerHTML = Array.from({ length: 3 }, (_, line) => {
        const lineEntries = entries.slice(line * 8, line * 8 + 8);
        const lineClasses = ["layout-memory-line"];
        if (loadedLines.has(line)) lineClasses.push("is-loaded");
        if (lineEntries.some(({ field, record }) => currentKeys.has(keyOf(field, record)))) {
          lineClasses.push("is-current");
        }

        const fields = lineEntries.map(({ field, record }) => {
          const key = keyOf(field, record);
          const fieldClasses = ["layout-field"];
          if (accessed.has(key)) fieldClasses.push("is-used");
          if (currentKeys.has(key)) fieldClasses.push("is-current");
          return `<span class="${fieldClasses.join(" ")}" aria-label="${fieldNames[field]} for record ${record}">${key}</span>`;
        }).join("");

        return `<div class="${lineClasses.join(" ")}"><div class="layout-line-label">cache line ${line} · 64 B</div><div class="layout-fields">${fields}</div></div>`;
      }).join("");

      const usefulBytes = accessed.size * 8;
      const fetchedBytes = loadedLines.size * 64;
      const efficiency = fetchedBytes === 0 ? 0 : Math.round((usefulBytes / fetchedBytes) * 100);
      recordsElement.textContent = String(cursor);
      linesElement.textContent = String(loadedLines.size);
      efficiencyElement.textContent = `${efficiency}%`;

      if (message) {
        status.textContent = message;
      } else {
        const layout = layoutInput.value === "aos" ? "records keep their fields together" : "each field forms its own contiguous array";
        const workload = workloadInput.value === "price" ? "reads only prices" : "reads every field";
        status.textContent = `This layout ${layout}; the workload ${workload}.`;
      }

      const done = cursor >= 8;
      stepButton.disabled = done || timer !== null;
      runButton.disabled = done || timer !== null;
      layoutInput.disabled = timer !== null;
      workloadInput.disabled = timer !== null;
      memory.setAttribute("aria-label", `Three conceptual cache lines in ${layoutInput.value === "aos" ? "array-of-structures" : "structure-of-arrays"} layout. ${loadedLines.size} lines have been loaded.`);
    }

    function processNextRecord() {
      if (cursor >= 8) return false;
      const record = cursor;
      const wanted = workloadFields().map((field) => keyOf(field, record));
      currentKeys = new Set(wanted);
      const touchedLines = new Set();
      let newLines = 0;

      for (let position = 0; position < entries.length; position += 1) {
        const entry = entries[position];
        const key = keyOf(entry.field, entry.record);
        if (!currentKeys.has(key)) continue;
        const line = Math.floor(position / 8);
        touchedLines.add(line);
        accessed.add(key);
        if (!loadedLines.has(line)) {
          loadedLines.add(line);
          newLines += 1;
        }
      }

      cursor += 1;
      const fields = workloadFields().map((field) => fieldNames[field]).join(", ");
      let message = `Record ${record}: read ${fields} from line${touchedLines.size === 1 ? "" : "s"} ${[...touchedLines].join(", ")}; loaded ${newLines} new line${newLines === 1 ? "" : "s"}.`;
      if (cursor === 8) message += " Workload complete.";
      render(message);
      return cursor < 8;
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
      entries = makeEntries();
      cursor = 0;
      accessed = new Set();
      loadedLines = new Set();
      currentKeys = new Set();
      render();
    }

    stepButton.addEventListener("click", processNextRecord);
    runButton.addEventListener("click", () => {
      if (timer !== null || cursor >= 8) return;
      timer = setInterval(() => {
        if (!processNextRecord()) stopRun();
      }, 300);
      render("Running the selected workload…");
    });
    resetButton.addEventListener("click", reset);
    layoutInput.addEventListener("change", reset);
    workloadInput.addEventListener("change", reset);
    reset();
  }

  function initializeBranchPrediction(root) {
    const sequences = {
      grouped: "NNNNNNNNNNTTTTTTTTTTTTTT",
      "mostly-taken": "TTTNTTTTTNTTTTNTTTTTNTTT",
      alternating: "TNTNTNTNTNTNTNTNTNTNTNTN",
      mixed: "TNN TTT NNT TNT NTT NNT TTN TNN".replaceAll(" ", ""),
    };
    const stateLabels = [
      "strongly not taken",
      "weakly not taken",
      "weakly taken",
      "strongly taken",
    ];

    const patternInput = root.querySelector("[data-branch-pattern]");
    const statesElement = root.querySelector("[data-branch-states]");
    const predictionElement = root.querySelector("[data-branch-prediction]");
    const outcomesElement = root.querySelector("[data-branch-outcomes]");
    const status = root.querySelector("[data-branch-status]");
    const branchesElement = root.querySelector("[data-branch-count]");
    const missesElement = root.querySelector("[data-branch-misses]");
    const accuracyElement = root.querySelector("[data-branch-accuracy]");
    const stepButton = root.querySelector('[data-branch-action="step"]');
    const runButton = root.querySelector('[data-branch-action="run"]');
    const resetButton = root.querySelector('[data-branch-action="reset"]');

    let sequence;
    let cursor;
    let predictorState;
    let misses;
    let results;
    let timer = null;

    const prediction = () => predictorState >= 2;
    const outcomeName = (taken) => taken ? "taken" : "not taken";

    function render(message) {
      statesElement.innerHTML = stateLabels.map((label, state) =>
        `<span class="branch-state${state === predictorState ? " is-current" : ""}">${state}<br>${label}</span>`
      ).join("");

      predictionElement.textContent = cursor >= sequence.length
        ? `final state: ${stateLabels[predictorState]}`
        : `current prediction: ${outcomeName(prediction())}`;

      outcomesElement.innerHTML = sequence.map((taken, index) => {
        const classes = ["branch-outcome"];
        if (results[index]?.correct) classes.push("is-correct");
        if (results[index] && !results[index].correct) classes.push("is-miss");
        if (index === cursor) classes.push("is-next");
        return `<span class="${classes.join(" ")}" aria-label="branch ${index}: ${outcomeName(taken)}">${taken ? "T" : "N"}</span>`;
      }).join("");

      const accuracy = cursor === 0 ? 0 : Math.round(((cursor - misses) / cursor) * 100);
      branchesElement.textContent = String(cursor);
      missesElement.textContent = String(misses);
      accuracyElement.textContent = `${accuracy}%`;
      status.textContent = message || "The predictor begins weakly not taken. Step through the actual outcomes and watch it adapt.";

      const done = cursor >= sequence.length;
      stepButton.disabled = done || timer !== null;
      runButton.disabled = done || timer !== null;
      patternInput.disabled = timer !== null;
      outcomesElement.setAttribute("aria-label", `Branch outcome sequence with ${cursor} of ${sequence.length} outcomes processed and ${misses} mispredictions.`);
    }

    function processNextBranch() {
      if (cursor >= sequence.length) return false;
      const actual = sequence[cursor];
      const predicted = prediction();
      const previousState = predictorState;
      const correct = predicted === actual;
      if (!correct) misses += 1;
      results[cursor] = { correct, predicted };

      if (actual) {
        predictorState = Math.min(3, predictorState + 1);
      } else {
        predictorState = Math.max(0, predictorState - 1);
      }

      cursor += 1;
      let message = `Predicted ${outcomeName(predicted)}; actual outcome was ${outcomeName(actual)}: ${correct ? "correct" : "misprediction"}. State ${previousState} → ${predictorState}.`;
      if (cursor === sequence.length) message += ` Finished with ${misses} mispredictions.`;
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
      sequence = [...sequences[patternInput.value]].map((outcome) => outcome === "T");
      cursor = 0;
      predictorState = 1;
      misses = 0;
      results = [];
      render();
    }

    stepButton.addEventListener("click", processNextBranch);
    runButton.addEventListener("click", () => {
      if (timer !== null || cursor >= sequence.length) return;
      timer = setInterval(() => {
        if (!processNextBranch()) stopRun();
      }, 280);
      render("Running the selected branch pattern…");
    });
    resetButton.addEventListener("click", reset);
    patternInput.addEventListener("change", reset);
    reset();
  }

  function initializeVirtualMemory(root) {
    const pageSize = 4096;
    const frames = [5, 2, 7, 1, 6];
    const makeSequence = (pages) => pages.map((vpn, index) => ({
      vpn,
      offset: (index * 192) % pageSize,
    }));
    const sequences = {
      "one-page": makeSequence(Array(20).fill(2)),
      "streaming-pages": makeSequence([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4]),
      "working-set": makeSequence([0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1, 2, 0, 1]),
      thrashing: makeSequence([0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3]),
    };

    const patternInput = root.querySelector("[data-vm-pattern]");
    const virtualElement = root.querySelector("[data-vm-virtual]");
    const lookupElement = root.querySelector("[data-vm-lookup]");
    const physicalElement = root.querySelector("[data-vm-physical]");
    const tlbElement = root.querySelector("[data-vm-tlb]");
    const pageTableElement = root.querySelector("[data-vm-page-table]");
    const sequenceElement = root.querySelector("[data-vm-sequence]");
    const status = root.querySelector("[data-vm-status]");
    const accessesElement = root.querySelector("[data-vm-accesses]");
    const hitsElement = root.querySelector("[data-vm-hits]");
    const walksElement = root.querySelector("[data-vm-walks]");
    const stepButton = root.querySelector('[data-vm-action="step"]');
    const runButton = root.querySelector('[data-vm-action="run"]');
    const resetButton = root.querySelector('[data-vm-action="reset"]');

    let sequence;
    let cursor;
    let tlb;
    let hits;
    let walks;
    let current;
    let results;
    let timer = null;

    const hex = (value) => `0x${value.toString(16).padStart(4, "0")}`;

    function render(message) {
      const next = cursor < sequence.length ? sequence[cursor] : null;
      if (current) {
        const virtualAddress = current.vpn * pageSize + current.offset;
        const physicalAddress = current.frame * pageSize + current.offset;
        virtualElement.innerHTML = `<span class="vm-stage-label">virtual address</span><strong>${hex(virtualAddress)}</strong><span>VPN ${current.vpn} + offset ${current.offset}</span>`;
        lookupElement.innerHTML = `<span class="vm-stage-label">translation</span><strong>${current.hit ? "TLB hit" : "page-table walk"}</strong><span>VPN ${current.vpn} → frame ${current.frame}</span>`;
        physicalElement.innerHTML = `<span class="vm-stage-label">physical address</span><strong>${hex(physicalAddress)}</strong><span>frame ${current.frame} + offset ${current.offset}</span>`;
      } else {
        virtualElement.innerHTML = '<span class="vm-stage-label">virtual address</span><strong>—</strong><span>VPN + offset</span>';
        lookupElement.innerHTML = '<span class="vm-stage-label">translation</span><strong>—</strong><span>TLB or page table</span>';
        physicalElement.innerHTML = '<span class="vm-stage-label">physical address</span><strong>—</strong><span>frame + offset</span>';
      }

      tlbElement.innerHTML = Array.from({ length: 3 }, (_, slot) => {
        const entry = tlb[slot];
        if (!entry) return '<span class="vm-entry"><span>empty</span><span>—</span></span>';
        const currentClass = current?.vpn === entry.vpn ? " is-current" : "";
        return `<span class="vm-entry is-present${currentClass}"><span>VPN ${entry.vpn}</span><span>frame ${entry.frame}</span></span>`;
      }).join("");

      pageTableElement.innerHTML = frames.map((frame, vpn) => {
        const currentClass = current?.vpn === vpn ? " is-current" : "";
        return `<span class="vm-entry${currentClass}"><span>VPN ${vpn}</span><span>frame ${frame}</span></span>`;
      }).join("");

      sequenceElement.innerHTML = sequence.map((access, index) => {
        const classes = ["vm-access"];
        if (results[index]?.hit) classes.push("is-hit");
        if (results[index] && !results[index].hit) classes.push("is-walk");
        if (index === cursor) classes.push("is-next");
        return `<span class="${classes.join(" ")}" aria-label="access ${index}: virtual page ${access.vpn}">v${access.vpn}</span>`;
      }).join("");

      accessesElement.textContent = String(cursor);
      hitsElement.textContent = String(hits);
      walksElement.textContent = String(walks);
      status.textContent = message || "All virtual pages are resident. A missing TLB entry requires translation work, not disk I/O.";

      const done = cursor >= sequence.length;
      stepButton.disabled = done || timer !== null;
      runButton.disabled = done || timer !== null;
      patternInput.disabled = timer !== null;
      sequenceElement.setAttribute("aria-label", `Virtual-page access sequence with ${cursor} of ${sequence.length} translations completed, ${hits} TLB hits, and ${walks} page-table walks.`);

      if (!current && next) virtualElement.setAttribute("aria-label", `Next virtual page is ${next.vpn} with offset ${next.offset}.`);
    }

    function translateNext() {
      if (cursor >= sequence.length) return false;
      const access = sequence[cursor];
      const foundAt = tlb.findIndex((entry) => entry.vpn === access.vpn);
      const hit = foundAt >= 0;
      let evicted = null;

      if (hit) {
        hits += 1;
        const [entry] = tlb.splice(foundAt, 1);
        tlb.push(entry);
      } else {
        walks += 1;
        if (tlb.length === 3) evicted = tlb.shift();
        tlb.push({ vpn: access.vpn, frame: frames[access.vpn] });
      }

      current = {
        ...access,
        frame: frames[access.vpn],
        hit,
      };
      results[cursor] = { hit };
      cursor += 1;

      let message = hit
        ? `VPN ${access.vpn} hit in the TLB; reused frame ${current.frame}.`
        : `VPN ${access.vpn} missed in the TLB; walked the page table and cached frame ${current.frame}.`;
      if (evicted) message += ` Evicted VPN ${evicted.vpn} from the three-entry TLB.`;
      if (cursor === sequence.length) message += ` Finished with ${hits} hits and ${walks} walks.`;
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
      sequence = sequences[patternInput.value];
      cursor = 0;
      tlb = [];
      hits = 0;
      walks = 0;
      current = null;
      results = [];
      render();
    }

    stepButton.addEventListener("click", translateNext);
    runButton.addEventListener("click", () => {
      if (timer !== null || cursor >= sequence.length) return;
      timer = setInterval(() => {
        if (!translateNext()) stopRun();
      }, 300);
      render("Running the selected virtual-page pattern…");
    });
    resetButton.addEventListener("click", reset);
    patternInput.addEventListener("change", reset);
    reset();
  }

  function initialize() {
    document.querySelectorAll('[data-system-demo="memory-hierarchy"]')
      .forEach(initializeMemoryHierarchy);
    document.querySelectorAll('[data-system-demo="data-layout"]')
      .forEach(initializeDataLayout);
    document.querySelectorAll('[data-system-demo="branch-prediction"]')
      .forEach(initializeBranchPrediction);
    document.querySelectorAll('[data-system-demo="virtual-memory"]')
      .forEach(initializeVirtualMemory);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();

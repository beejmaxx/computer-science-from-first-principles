(() => {
  const memoryDescriptions = {
    sequential: "Sequential scan exposes adjacent addresses and can reuse packed cache lines.",
    strided: "A stride of five visits every logical record but delays reuse of neighboring bytes.",
    "pointer-chase": "Each next logical record is discovered from the current node, forming a dependent chain.",
    "hot-loop": "Four logical records repeat, exposing whether their physical lines fit in the selected cache.",
  };

  function deterministicPermutation(length, salt = 0) {
    const values = Array.from({ length }, (_, index) => index);
    let seed = (0x9e3779b9 ^ length ^ salt) >>> 0;
    for (let index = length - 1; index > 0; index -= 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const other = seed % (index + 1);
      [values[index], values[other]] = [values[other], values[index]];
    }
    return values;
  }

  function initializeMemoryHierarchy(root) {
    const patternInput = root.querySelector("[data-memory-pattern]");
    const layoutInput = root.querySelector("[data-memory-layout]");
    const workingSetInput = root.querySelector("[data-memory-working-set]");
    const capacityInput = root.querySelector("[data-memory-capacity]");
    const memory = root.querySelector("[data-memory-lines]");
    const cacheContents = root.querySelector("[data-cache-contents]");
    const mapElement = root.querySelector("[data-memory-map]");
    const transferElement = root.querySelector("[data-memory-transfer]");
    const status = root.querySelector("[data-memory-status]");
    const historyElement = root.querySelector("[data-memory-history]");
    const accessesElement = root.querySelector("[data-memory-accesses]");
    const hitsElement = root.querySelector("[data-memory-hits]");
    const missesElement = root.querySelector("[data-memory-misses]");
    const hitRateElement = root.querySelector("[data-memory-hit-rate]");
    const utilizationElement = root.querySelector("[data-memory-utilization]");
    const stepButton = root.querySelector('[data-memory-action="step"]');
    const runButton = root.querySelector('[data-memory-action="run"]');
    const resetButton = root.querySelector('[data-memory-action="reset"]');

    let sequence = [];
    let lines = [];
    let logicalToLine = [];
    let cursor = 0;
    let cache = [];
    let hits = 0;
    let misses = 0;
    let fetchedSlots = 0;
    let usedFetchedSlots = 0;
    let currentRecord = null;
    let currentLine = null;
    let history = [];
    let timer = null;
    let lastMessage = "";

    function makeSequence(size) {
      if (patternInput.value === "sequential") {
        return Array.from({ length: size }, (_, index) => index);
      }
      if (patternInput.value === "strided") {
        return Array.from({ length: size }, (_, index) => (index * 5) % size);
      }
      if (patternInput.value === "hot-loop") {
        return Array.from({ length: size * 2 }, (_, index) => index % 4);
      }
      return deterministicPermutation(size, 0x51f15e);
    }

    function makeLayout(size) {
      if (layoutInput.value === "packed") {
        lines = Array.from({ length: Math.ceil(size / 4) }, (_, line) =>
          Array.from({ length: 4 }, (_, offset) => line * 4 + offset)
            .filter((record) => record < size));
        logicalToLine = Array.from({ length: size }, (_, record) => Math.floor(record / 4));
        mapElement.textContent = "four 16-byte records per 64-byte line";
        return;
      }

      const physicalOrder = deterministicPermutation(size, 0xcac4e);
      lines = physicalOrder.map((record) => [record]);
      logicalToLine = Array(size);
      physicalOrder.forEach((record, line) => { logicalToLine[record] = line; });
      mapElement.textContent = "one 16-byte node per scattered 64-byte line";
    }

    function cacheEntry(line) {
      return cache.find((entry) => entry.line === line);
    }

    function renderMemory(nextRecord) {
      memory.classList.toggle("is-node-layout", layoutInput.value === "nodes");
      memory.innerHTML = lines.map((records, line) => {
        const entry = cacheEntry(line);
        const classes = ["memory-line"];
        if (entry) classes.push("is-cached");
        if (line === currentLine) classes.push("is-current");

        const recordCells = records.map((record) => {
          const recordClasses = ["memory-record"];
          if (record === currentRecord) recordClasses.push("is-current");
          if (record === nextRecord) recordClasses.push("is-next");
          if (entry && entry.used.has(record)) recordClasses.push("is-used");
          return `<span class="${recordClasses.join(" ")}">R${record}</span>`;
        }).join("");
        const unused = layoutInput.value === "nodes"
          ? '<span class="memory-unused">48 B unused</span>'
          : "";
        return `<div class="${classes.join(" ")}"><div class="memory-line-label">line ${line} · 64 B</div><div class="memory-records">${recordCells}${unused}</div></div>`;
      }).join("");
    }

    function render(message) {
      const nextRecord = cursor < sequence.length ? sequence[cursor] : null;
      renderMemory(nextRecord);

      const capacity = Number(capacityInput.value);
      cacheContents.innerHTML = Array.from({ length: capacity }, (_, slot) => {
        const entry = cache[slot];
        return entry
          ? `<span class="cache-slot"><strong>line ${entry.line}</strong><small>${entry.used.size}/4 useful slots</small></span>`
          : '<span class="cache-slot is-empty"><strong>empty</strong><small>available</small></span>';
      }).join("");

      const accesses = hits + misses;
      const hitRate = accesses === 0 ? null : Math.round((hits / accesses) * 100);
      const utilization = fetchedSlots === 0 ? null : Math.round((usedFetchedSlots / fetchedSlots) * 100);
      accessesElement.textContent = String(accesses);
      hitsElement.textContent = String(hits);
      missesElement.textContent = String(misses);
      hitRateElement.textContent = hitRate === null ? "—" : `${hitRate}%`;
      utilizationElement.textContent = utilization === null ? "—" : `${utilization}%`;
      historyElement.textContent = history.length
        ? `recent accesses: ${history.slice(-10).map(({ record, line }) => `R${record}@L${line}`).join(" → ")}`
        : "recent accesses: —";

      lastMessage = message || memoryDescriptions[patternInput.value];
      status.textContent = lastMessage;
      const done = cursor >= sequence.length;
      stepButton.disabled = done || timer !== null;
      runButton.disabled = done && timer === null;
      runButton.textContent = timer === null ? "Run" : "Pause";
      runButton.setAttribute("aria-pressed", timer === null ? "false" : "true");
      [patternInput, layoutInput, workingSetInput, capacityInput].forEach((input) => {
        input.disabled = timer !== null;
      });
      memory.setAttribute("aria-label", `${lines.length} conceptual memory lines. Cache contains ${cache.length ? cache.map((entry) => `line ${entry.line}`).join(", ") : "no lines"}.`);
    }

    function accessNext() {
      if (cursor >= sequence.length) return false;
      currentRecord = sequence[cursor];
      currentLine = logicalToLine[currentRecord];
      const foundAt = cache.findIndex((entry) => entry.line === currentLine);
      let message;

      if (foundAt >= 0) {
        hits += 1;
        const entry = cache.splice(foundAt, 1)[0];
        if (!entry.used.has(currentRecord)) {
          entry.used.add(currentRecord);
          usedFetchedSlots += 1;
        }
        cache.push(entry);
        transferElement.textContent = `Hit: line ${currentLine} was already resident; no new line transfer.`;
        message = `R${currentRecord} maps to physical line ${currentLine}: cache hit.`;
      } else {
        misses += 1;
        fetchedSlots += 4;
        usedFetchedSlots += 1;
        const evicted = cache.length === Number(capacityInput.value) ? cache.shift() : null;
        cache.push({ line: currentLine, used: new Set([currentRecord]) });
        transferElement.textContent = evicted
          ? `Miss: fetched 64-byte line ${currentLine}; evicted line ${evicted.line}.`
          : `Miss: fetched all 64 bytes of line ${currentLine}.`;
        message = evicted
          ? `R${currentRecord} maps to line ${currentLine}: miss, replacing least-recently-used line ${evicted.line}.`
          : `R${currentRecord} maps to line ${currentLine}: compulsory miss.`;
      }

      history.push({ record: currentRecord, line: currentLine });
      cursor += 1;
      if (cursor === sequence.length) {
        message += ` Complete: ${hits} hits, ${misses} misses.`;
      }
      render(message);
      return cursor < sequence.length;
    }

    function stopRun(message) {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
      render(message || lastMessage);
    }

    function reset() {
      stopRun();
      const size = Number(workingSetInput.value);
      makeLayout(size);
      sequence = makeSequence(size);
      cursor = 0;
      cache = [];
      hits = 0;
      misses = 0;
      fetchedSlots = 0;
      usedFetchedSlots = 0;
      currentRecord = null;
      currentLine = null;
      history = [];
      transferElement.textContent = "No line transferred yet.";
      render();
    }

    stepButton.addEventListener("click", accessNext);
    runButton.addEventListener("click", () => {
      if (timer !== null) {
        stopRun("Paused. Cache contents and progress are preserved.");
        return;
      }
      if (cursor >= sequence.length) return;
      timer = setInterval(() => {
        if (!accessNext()) stopRun();
      }, 260);
      render("Running the selected physical access experiment…");
    });
    resetButton.addEventListener("click", reset);
    [patternInput, layoutInput, workingSetInput, capacityInput]
      .forEach((input) => input.addEventListener("change", reset));
    reset();
  }

  function initializeDataLayout(root) {
    const fieldNames = {
      P: "price",
      Q: "quantity",
      T: "timestamp",
      I: "order ID",
      M0: "metadata chunk 1",
      M1: "metadata chunk 2",
      M2: "metadata chunk 3",
    };
    const allFields = ["P", "Q", "T", "I", "M0", "M1", "M2"];
    const hotFields = ["P", "Q", "T", "I"];
    const metadataFields = ["M0", "M1", "M2"];
    const layoutInput = root.querySelector("[data-layout-kind]");
    const workloadInput = root.querySelector("[data-layout-workload]");
    const strideInput = root.querySelector("[data-layout-stride]");
    const memory = root.querySelector("[data-layout-memory]");
    const descriptionElement = root.querySelector("[data-layout-description]");
    const progressElement = root.querySelector("[data-layout-progress]");
    const status = root.querySelector("[data-layout-status]");
    const recordsElement = root.querySelector("[data-layout-records]");
    const linesElement = root.querySelector("[data-layout-lines]");
    const usefulElement = root.querySelector("[data-layout-useful]");
    const wasteElement = root.querySelector("[data-layout-waste]");
    const efficiencyElement = root.querySelector("[data-layout-efficiency]");
    const stepButton = root.querySelector('[data-layout-action="step"]');
    const runButton = root.querySelector('[data-layout-action="run"]');
    const resetButton = root.querySelector('[data-layout-action="reset"]');

    let entries = [];
    let cursor = 0;
    let accessed = new Set();
    let loadedLines = new Set();
    let currentKeys = new Set();
    let timer = null;
    let lastMessage = "";

    const keyOf = (field, record) => `${field}:${record}`;

    function workloadFields() {
      if (workloadInput.value === "price") return ["P"];
      if (workloadInput.value === "matching") return ["P", "Q", "I"];
      return allFields;
    }

    function entry(field, record, region) {
      return { field, record, region, padding: false };
    }

    function makeEntries() {
      const result = [];
      if (layoutInput.value === "aos") {
        for (let record = 0; record < 8; record += 1) {
          for (const field of allFields) result.push(entry(field, record, `record ${record}`));
          if (strideInput.value === "aligned") {
            result.push({ field: "PAD", record, region: `record ${record}`, padding: true });
          }
        }
      } else if (layoutInput.value === "soa") {
        for (const field of allFields) {
          for (let record = 0; record < 8; record += 1) {
            result.push(entry(field, record, fieldNames[field]));
          }
        }
      } else {
        for (let record = 0; record < 8; record += 1) {
          for (const field of hotFields) result.push(entry(field, record, "hot"));
        }
        for (let record = 0; record < 8; record += 1) {
          for (const field of metadataFields) result.push(entry(field, record, "cold"));
        }
      }
      return result;
    }

    function displayField(item) {
      if (item.padding) return "pad";
      if (item.field.startsWith("M")) {
        return `M${item.record}${String.fromCharCode(97 + Number(item.field.slice(1)))}`;
      }
      return `${item.field}${item.record}`;
    }

    function describeLayout() {
      if (layoutInput.value === "aos") {
        return strideInput.value === "aligned"
          ? "complete 56-byte records use an explicit 64-byte stride"
          : "complete 56-byte records are packed and may cross lines";
      }
      if (layoutInput.value === "soa") return "equal fields form contiguous columns";
      return "32-byte hot records are separated from 24-byte cold metadata";
    }

    function render(message) {
      const lineCount = Math.ceil(entries.length / 8);
      memory.innerHTML = Array.from({ length: lineCount }, (_, line) => {
        const lineEntries = entries.slice(line * 8, line * 8 + 8);
        const lineClasses = ["layout-memory-line"];
        if (loadedLines.has(line)) lineClasses.push("is-loaded");
        if (lineEntries.some(({ field, record, padding }) => !padding && currentKeys.has(keyOf(field, record)))) {
          lineClasses.push("is-current");
        }

        const regions = [...new Set(lineEntries.map((item) => item.region))];
        const region = regions.length > 2 ? "mixed records" : regions.join(" / ");
        const fields = lineEntries.map((item) => {
          const key = keyOf(item.field, item.record);
          const fieldClasses = ["layout-field"];
          fieldClasses.push(item.padding ? "is-padding" : `is-${item.field.charAt(0).toLowerCase()}`);
          if (!item.padding && accessed.has(key)) fieldClasses.push("is-used");
          if (!item.padding && currentKeys.has(key)) fieldClasses.push("is-current");
          const label = item.padding ? "8 bytes of padding" : `${fieldNames[item.field]} for record ${item.record}`;
          return `<span class="${fieldClasses.join(" ")}" aria-label="${label}">${displayField(item)}</span>`;
        }).join("");

        return `<div class="${lineClasses.join(" ")}"><div class="layout-line-label"><span>cache line ${line} · 64 B</span><small>${region}</small></div><div class="layout-fields">${fields}</div></div>`;
      }).join("");

      const usefulBytes = accessed.size * 8;
      const fetchedBytes = loadedLines.size * 64;
      const wastedBytes = Math.max(0, fetchedBytes - usefulBytes);
      const efficiency = fetchedBytes === 0 ? 0 : Math.round((usefulBytes / fetchedBytes) * 100);
      recordsElement.textContent = String(cursor);
      linesElement.textContent = String(loadedLines.size);
      usefulElement.textContent = `${usefulBytes} B`;
      wasteElement.textContent = `${wastedBytes} B`;
      efficiencyElement.textContent = fetchedBytes === 0 ? "—" : `${efficiency}%`;
      descriptionElement.textContent = describeLayout();
      progressElement.textContent = cursor < 8 ? `next: record ${cursor}` : "workload complete";

      lastMessage = message || `This layout ${describeLayout()}; the workload reads ${workloadFields().map((field) => fieldNames[field]).join(", ")}.`;
      status.textContent = lastMessage;

      const done = cursor >= 8;
      stepButton.disabled = done || timer !== null;
      runButton.disabled = done && timer === null;
      runButton.textContent = timer === null ? "Run" : "Pause";
      runButton.setAttribute("aria-pressed", timer === null ? "false" : "true");
      layoutInput.disabled = timer !== null;
      workloadInput.disabled = timer !== null;
      strideInput.disabled = timer !== null || layoutInput.value !== "aos";
      memory.setAttribute("aria-label", `${lineCount} conceptual cache lines in ${layoutInput.options[layoutInput.selectedIndex].text} layout. ${loadedLines.size} lines have been fetched.`);
    }

    function processNextRecord() {
      if (cursor >= 8) return false;
      const record = cursor;
      const wantedFields = workloadFields();
      const wanted = wantedFields.map((field) => keyOf(field, record));
      currentKeys = new Set(wanted);
      const touchedLines = new Set();
      let newLines = 0;

      for (let position = 0; position < entries.length; position += 1) {
        const entry = entries[position];
        if (entry.padding) continue;
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
      const fields = wantedFields.map((field) => fieldNames[field]).join(", ");
      let message = `Record ${record}: read ${fields} from line${touchedLines.size === 1 ? "" : "s"} ${[...touchedLines].join(", ")}; loaded ${newLines} new line${newLines === 1 ? "" : "s"}.`;
      if (cursor === 8) message += " Workload complete.";
      render(message);
      return cursor < 8;
    }

    function stopRun(message) {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
      render(message || lastMessage);
    }

    function reset() {
      stopRun();
      entries = makeEntries();
      cursor = 0;
      accessed = new Set();
      loadedLines = new Set();
      currentKeys = new Set();
      render();
    }

    stepButton.addEventListener("click", processNextRecord);
    runButton.addEventListener("click", () => {
      if (timer !== null) {
        stopRun("Paused. Fetched lines and record progress are preserved.");
        return;
      }
      if (cursor >= 8) return;
      timer = setInterval(() => {
        if (!processNextRecord()) stopRun();
      }, 300);
      render("Running the selected workload…");
    });
    resetButton.addEventListener("click", reset);
    [layoutInput, workloadInput, strideInput]
      .forEach((input) => input.addEventListener("change", reset));
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

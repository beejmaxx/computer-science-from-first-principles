(() => {
  function initializeBinarySearch(root) {
    const values = [3, 7, 11, 18, 24, 24, 42, 57, 68];
    const targetInput = root.querySelector("[data-binary-target]");
    const array = root.querySelector("[data-binary-array]");
    const range = root.querySelector("[data-binary-range]");
    const status = root.querySelector("[data-binary-status]");
    const stepButton = root.querySelector('[data-binary-action="step"]');
    const resetButton = root.querySelector('[data-binary-action="reset"]');

    let low;
    let high;
    let comparisons;
    let lastCompared;

    const target = () => Number(targetInput.value);

    function render(message) {
      const done = low === high;
      const middle = done ? null : low + Math.floor((high - low) / 2);
      const result = done ? low : null;

      array.innerHTML = values.map((value, index) => {
        const classes = ["binary-search-cell"];
        if (index < low || index >= high) classes.push("is-outside");
        if (index === middle) classes.push("is-next");
        if (done && index === result) classes.push("is-result");
        const marker = index === middle
          ? '<span class="binary-search-marker">mid</span>'
          : done && index === result
            ? '<span class="binary-search-marker">bound</span>'
            : "";
        return `<span class="${classes.join(" ")}">${marker}<strong>${value}</strong><span class="binary-search-index">${index}</span></span>`;
      }).join("");

      range.textContent = done
        ? `low = high = ${low} · ${comparisons} comparison${comparisons === 1 ? "" : "s"}`
        : `possible boundary: [${low}, ${high}) · next mid = ${middle}`;

      if (message) {
        status.textContent = message;
      } else {
        status.textContent = `Find the first value greater than or equal to ${target()}. Every index in [${low}, ${high}) is still possible.`;
      }

      if (done) {
        if (result === values.length) {
          status.textContent += ` The insertion point is after the final element.`;
        } else if (values[result] === target()) {
          status.textContent += ` Index ${result} is the first exact match.`;
        } else {
          status.textContent += ` Index ${result} is the insertion point before ${values[result]}.`;
        }
      }

      array.setAttribute("aria-label", `Sorted values ${values.join(", ")}. Current possible boundary is from index ${low} through ${high}, end exclusive.`);
      stepButton.disabled = done;
    }

    function reset() {
      low = 0;
      high = values.length;
      comparisons = 0;
      lastCompared = null;
      render();
    }

    function step() {
      if (low === high) return;
      const middle = low + Math.floor((high - low) / 2);
      const value = values[middle];
      lastCompared = middle;
      comparisons += 1;

      if (value < target()) {
        low = middle + 1;
        render(`${value} is below ${target()}, so indices through ${lastCompared} cannot be the boundary.`);
      } else {
        high = middle;
        render(`${value} is at least ${target()}, so the boundary is at index ${lastCompared} or earlier.`);
      }
    }

    targetInput.addEventListener("change", reset);
    stepButton.addEventListener("click", step);
    resetButton.addEventListener("click", reset);
    reset();
  }

  function initialize() {
    document.querySelectorAll('[data-algorithm-demo="binary-search"]')
      .forEach(initializeBinarySearch);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();

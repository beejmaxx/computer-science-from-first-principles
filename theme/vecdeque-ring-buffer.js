// Interactive VecDeque ring-buffer visualization.
// The root check makes this script safe to load on every mdBook page.

(() => {
  const root = document.getElementById("vecdeque-ring-explainer");
  if (!root) return;

  const capacity = 8;
  let slots;
  let head;
  let length;
  let nextValue;

  const ring = root.querySelector("[data-ring]");
  const svgNamespace = "http://www.w3.org/2000/svg";
  const centerX = 280;
  const centerY = 180;
  const ringRadius = 120;
  const slotRadius = 31;

  function createSvgElement(name, attributes = {}) {
    const element = document.createElementNS(svgNamespace, name);

    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, value);
    }

    return element;
  }

  const nodes = Array.from({ length: capacity }, (_, index) => {
    const angle = (-90 + index * 360 / capacity) * Math.PI / 180;
    const x = centerX + Math.cos(angle) * ringRadius;
    const y = centerY + Math.sin(angle) * ringRadius;
    const outerX = centerX + Math.cos(angle) * (ringRadius + 48);
    const outerY = centerY + Math.sin(angle) * (ringRadius + 48);
    const markerX = centerX + Math.cos(angle) * (ringRadius - 51);
    const markerY = centerY + Math.sin(angle) * (ringRadius - 51);

    const group = createSvgElement("g");
    const circle = createSvgElement("circle", {
      cx: x,
      cy: y,
      r: slotRadius,
      class: "vd-slot",
    });
    const value = createSvgElement("text", { x, y, class: "vd-value" });
    const slotIndex = createSvgElement("text", {
      x: outerX,
      y: outerY,
      class: "vd-index",
    });
    const marker = createSvgElement("text", {
      x: markerX,
      y: markerY,
      class: "vd-marker",
    });

    slotIndex.textContent = `slot ${index}`;
    group.append(circle, value, slotIndex, marker);
    ring.append(group);

    return { circle, value, marker };
  });

  function physicalIndex(logicalIndex) {
    return (head + logicalIndex) % capacity;
  }

  function logicalValues() {
    return Array.from(
      { length },
      (_, logicalIndex) => slots[physicalIndex(logicalIndex)],
    );
  }

  function render(message) {
    const tailNext = physicalIndex(length);
    const occupiedSlots = new Set(
      Array.from({ length }, (_, logicalIndex) => physicalIndex(logicalIndex)),
    );

    nodes.forEach((node, index) => {
      const filledClass = occupiedSlots.has(index) ? " is-filled" : "";
      const headClass = length > 0 && index === head ? " is-head" : "";

      node.circle.setAttribute("class", `vd-slot${filledClass}${headClass}`);
      node.value.textContent = occupiedSlots.has(index) ? slots[index] : "·";
      node.marker.textContent =
        length > 0 && index === head
          ? "head"
          : index === tailNext
            ? "tail-next"
            : "";
    });

    root.querySelector("[data-head]").textContent = length > 0 ? head : "—";
    root.querySelector("[data-len]").textContent = length;
    root.querySelector("[data-tail]").textContent = tailNext;
    root.querySelector("[data-front]").textContent =
      length > 0 ? slots[head] : "empty";
    root.querySelector("[data-logical]").textContent =
      `[${logicalValues().join(", ")}]`;
    root.querySelector("[data-event]").textContent = message;

    root.querySelectorAll('[data-op^="push_"]').forEach((button) => {
      button.disabled = length === capacity;
    });
    root.querySelectorAll('[data-op^="pop_"]').forEach((button) => {
      button.disabled = length === 0;
    });
  }

  function reset() {
    slots = Array(capacity).fill(undefined);
    head = 6;
    length = 4;
    nextValue = 50;

    [10, 20, 30, 40].forEach((value, logicalIndex) => {
      slots[physicalIndex(logicalIndex)] = value;
    });

    render("Initial state wraps from slot 7 to slot 0.");
  }

  function pushBack(value) {
    const index = physicalIndex(length);
    slots[index] = value;
    length += 1;
    render(`push_back(${value}) wrote physical slot ${index}.`);
  }

  function pushFront(value) {
    head = (head - 1 + capacity) % capacity;
    slots[head] = value;
    length += 1;
    render(`push_front(${value}) moved head backward to slot ${head}.`);
  }

  function popFront() {
    const index = head;
    const value = slots[index];
    slots[index] = undefined;
    head = (head + 1) % capacity;
    length -= 1;
    render(`pop_front() removed ${value} from slot ${index}; head advanced.`);
  }

  function popBack() {
    const index = physicalIndex(length - 1);
    const value = slots[index];
    slots[index] = undefined;
    length -= 1;
    render(`pop_back() removed ${value} from physical slot ${index}.`);
  }

  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-op]");
    if (!button || button.disabled) return;

    switch (button.dataset.op) {
      case "reset":
        reset();
        return;
      case "push_back":
        pushBack(nextValue);
        nextValue += 10;
        return;
      case "push_front":
        pushFront(nextValue);
        nextValue += 10;
        return;
      case "pop_front":
        popFront();
        return;
      case "pop_back":
        popBack();
        return;
    }
  });

  reset();
})();

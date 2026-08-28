(function () {
  "use strict";

  var CAPACITY = 8;

  function markup() {
    var slots = Array.from({ length: CAPACITY }, function (_, index) {
      return '<div class="dd__slot" style="--dd-index:' + index + '" data-dd-slot="' + index + '">' +
        '<span class="dd__slot-index">physical ' + index + '</span>' +
        '<strong class="dd__slot-seq">empty</strong>' +
        '<span class="dd__slot-event">reusable</span></div>';
    }).join("");

    return [
      '<div class="dd__toolbar" aria-label="Disruptor controls">',
      '<button type="button" data-dd-action="publish">Publish one</button>',
      '<button type="button" data-dd-action="journal">Advance journal</button>',
      '<button type="button" data-dd-action="replica">Advance replica</button>',
      '<button type="button" data-dd-action="engine">Advance engine</button>',
      '<button type="button" data-dd-action="tick">Tick pipeline</button>',
      '<button type="button" data-dd-action="fill">Fill to gate</button>',
      '<button type="button" data-dd-action="run" aria-pressed="false">Run slow replica</button>',
      '<button type="button" data-dd-action="reset">Reset</button>',
      '</div>',
      '<div class="dd__layout">',
      '<section class="dd__panel"><div class="dd__panel-title"><span>Preallocated ring</span><small>sequence &amp; 7 → slot</small></div>',
      '<div class="dd__ring">', slots,
      '<div class="dd__hub"><strong data-dd-cursor>−1</strong><span>published cursor</span><span data-dd-next>next sequence 0</span></div>',
      '</div></section>',
      '<section class="dd__panel"><div class="dd__panel-title"><span>Sequence graph</span><small>progress, not item movement</small></div>',
      '<div class="dd__pipeline">',
      lane("producer", "Producer", "highest fully published event", "producer"),
      lane("journal", "Journal", "may read through published cursor", "journal"),
      lane("replica", "Replication", "may read through published cursor", "replica"),
      lane("engine", "Engine", "may read through min(journal, replication)", "engine"),
      '<div class="dd__dependency">',
      '<span><strong data-dd-published>−1</strong>published</span><span class="dd__arrow">→</span>',
      '<span><strong data-dd-join>−1</strong>min upstream</span><span class="dd__arrow">→</span>',
      '<span><strong data-dd-gate>−1</strong>gating reuse</span>',
      '</div></div></section></div>',
      '<p class="dd__message" data-dd-message aria-live="polite">The ring is empty. Publish sequence 0 into physical slot 0.</p>',
      '<div class="dd__metrics">',
      '<span>capacity <strong>8</strong></span>',
      '<span>next wrap point <strong data-dd-wrap>−8</strong></span>',
      '<span>in flight <strong data-dd-flight>0</strong></span>',
      '<span>producer state <strong data-dd-state>ready</strong></span>',
      '</div>',
      '<div class="dd__invariants"><span>✓ no overwrite before gate</span><span>✓ consumer ≤ dependency</span><span>✓ contiguous progress</span><span>✓ bounded capacity</span></div>'
    ].join("");
  }

  function lane(kind, name, rule, key) {
    return '<div class="dd__lane dd__lane--' + kind + '"><span class="dd__lane-name">' + name +
      '</span><strong class="dd__sequence" data-dd-' + key + '>−1</strong><span class="dd__lane-rule">' + rule + '</span></div>';
  }

  function createState() {
    return {
      cursor: -1,
      journal: -1,
      replica: -1,
      engine: -1,
      slots: Array.from({ length: CAPACITY }, function () { return null; }),
      lastSlot: null,
      message: "The ring is empty. Publish sequence 0 into physical slot 0.",
      blocked: false,
      timer: null,
      ticks: 0
    };
  }

  function canPublish(state) {
    var next = state.cursor + 1;
    return next - CAPACITY <= state.engine;
  }

  function publish(state) {
    var next = state.cursor + 1;
    var slot = next & (CAPACITY - 1);
    var wrapPoint = next - CAPACITY;

    if (!canPublish(state)) {
      state.blocked = true;
      state.lastSlot = slot;
      state.message = "Blocked: publishing sequence " + next + " would reuse physical slot " + slot +
        " before the engine has passed sequence " + wrapPoint + ". Advance the dependency graph.";
      return false;
    }

    state.cursor = next;
    state.slots[slot] = { sequence: next, event: "event " + next };
    state.lastSlot = slot;
    state.blocked = false;
    state.message = "Published sequence " + next + " into physical slot " + slot +
      ". Both independent upstream consumers may now observe it.";
    return true;
  }

  function advance(state, consumer) {
    var available = consumer === "engine" ? Math.min(state.journal, state.replica) : state.cursor;
    var current = state[consumer];
    var label = consumer === "replica" ? "Replication" : consumer.charAt(0).toUpperCase() + consumer.slice(1);

    if (current >= available) {
      state.lastSlot = current >= 0 ? current & (CAPACITY - 1) : null;
      state.message = label + " cannot advance: its next sequence is not yet available from " +
        (consumer === "engine" ? "both upstream dependencies." : "the producer.");
      return false;
    }

    state[consumer] = current + 1;
    state.lastSlot = state[consumer] & (CAPACITY - 1);
    state.blocked = false;
    state.message = label + " completed sequence " + state[consumer] +
      (consumer === "engine" ? ". That progress may release one slot for producer reuse." : ". Its progress is independent of the other upstream consumer.");
    return true;
  }

  function tick(state, slowReplica) {
    publish(state);
    advance(state, "journal");
    if (!slowReplica || state.ticks % 2 === 0) {
      advance(state, "replica");
    }
    advance(state, "engine");
    state.ticks += 1;
    state.message = slowReplica
      ? "Pipeline tick " + state.ticks + ": replication advances every other tick, so lag accumulates until gating applies backpressure."
      : "One pipeline tick completed. Each stage advanced at most one contiguous sequence.";
  }

  function render(root, state) {
    root.querySelector("[data-dd-cursor]").textContent = display(state.cursor);
    root.querySelector("[data-dd-producer]").textContent = display(state.cursor);
    root.querySelector("[data-dd-next]").textContent = "next sequence " + (state.cursor + 1);
    root.querySelector("[data-dd-published]").textContent = display(state.cursor);
    root.querySelector("[data-dd-join]").textContent = display(Math.min(state.journal, state.replica));
    root.querySelector("[data-dd-gate]").textContent = display(state.engine);
    root.querySelector("[data-dd-journal]").textContent = display(state.journal);
    root.querySelector("[data-dd-replica]").textContent = display(state.replica);
    root.querySelector("[data-dd-engine]").textContent = display(state.engine);
    root.querySelector("[data-dd-wrap]").textContent = display(state.cursor + 1 - CAPACITY);
    root.querySelector("[data-dd-flight]").textContent = String(state.cursor - state.engine);
    root.querySelector("[data-dd-state]").textContent = canPublish(state) ? "ready" : "gated";

    var message = root.querySelector("[data-dd-message]");
    message.textContent = state.message;
    message.classList.toggle("is-blocked", state.blocked);

    root.querySelectorAll("[data-dd-slot]").forEach(function (element) {
      var index = Number(element.getAttribute("data-dd-slot"));
      var item = state.slots[index];
      element.classList.toggle("is-active", index === state.lastSlot);
      element.classList.toggle("is-live", Boolean(item && item.sequence > state.engine));
      element.classList.toggle("is-reusable", Boolean(item && item.sequence <= state.engine));
      element.querySelector(".dd__slot-seq").textContent = item ? "seq " + item.sequence : "empty";
      element.querySelector(".dd__slot-event").textContent = item
        ? (item.sequence > state.engine ? item.event + " · live" : item.event + " · reusable")
        : "reusable";
    });

    var runButton = root.querySelector('[data-dd-action="run"]');
    runButton.setAttribute("aria-pressed", state.timer ? "true" : "false");
    runButton.textContent = state.timer ? "Pause" : "Run slow replica";
  }

  function display(value) {
    return value < 0 ? "−1" : String(value);
  }

  function stop(state) {
    if (state.timer) {
      window.clearInterval(state.timer);
      state.timer = null;
    }
  }

  function init(root) {
    root.innerHTML = markup();
    var state = createState();
    render(root, state);

    root.addEventListener("click", function (event) {
      var button = event.target.closest("[data-dd-action]");
      if (!button || !root.contains(button)) return;
      var action = button.getAttribute("data-dd-action");

      if (action === "reset") {
        stop(state);
        state = createState();
      } else if (action === "publish") {
        publish(state);
      } else if (action === "journal") {
        advance(state, "journal");
      } else if (action === "replica") {
        advance(state, "replica");
      } else if (action === "engine") {
        advance(state, "engine");
      } else if (action === "tick") {
        tick(state, false);
      } else if (action === "fill") {
        while (publish(state)) { /* fill until the gate stops reuse */ }
      } else if (action === "run") {
        if (state.timer) {
          stop(state);
          state.message = "Paused. The current sequences remain authoritative.";
        } else {
          state.message = "Running with deliberately slow replication. Watch lag and gating accumulate.";
          state.timer = window.setInterval(function () {
            tick(state, true);
            render(root, state);
          }, 650);
        }
      }

      render(root, state);
    });
  }

  function boot() {
    document.querySelectorAll("[data-disruptor-demo]").forEach(init);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
}());

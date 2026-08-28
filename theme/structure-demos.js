(() => {
  const esc = (value) => String(value).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
  const item = (value, key = value, active = false, extra = "") =>
    `<span class="ds-cell${active ? " active" : ""} ${extra}" data-key="${esc(key)}">${esc(value)}</span>`;
  const cells = (items) => `<div class="ds-cells">${items.join("")}</div>`;
  const label = (text) => `<div class="ds-label">${text}</div>`;
  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)");

  function place(root, html) {
    const visual = root.querySelector(".ds-demo-visual");
    const before = new Map([...visual.querySelectorAll("[data-key]")]
      .map((element) => [element.dataset.key, element.getBoundingClientRect()]));
    visual.innerHTML = html;
    if (prefersReduced.matches) return;
    visual.querySelectorAll("[data-key]").forEach((element) => {
      const old = before.get(element.dataset.key);
      if (!old) {
        element.animate([{ transform: "scale(.72)", opacity: 0 }, { transform: "none", opacity: 1 }],
          { duration: 220, easing: "cubic-bezier(.2,.8,.2,1)" });
        return;
      }
      const now = element.getBoundingClientRect();
      const x = old.left - now.left;
      const y = old.top - now.top;
      if (x || y) element.animate([{ transform: `translate(${x}px,${y}px)` }, { transform: "none" }],
        { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" });
    });
  }

  const heapUp = (heap, at) => {
    while (at > 0) {
      const parent = (at - 1) >> 1;
      if (heap[parent] >= heap[at]) break;
      [heap[parent], heap[at]] = [heap[at], heap[parent]];
      at = parent;
    }
  };
  const heapDown = (heap, at) => {
    for (;;) {
      const left = at * 2 + 1;
      if (left >= heap.length) return;
      const right = left + 1;
      const child = right < heap.length && heap[right] > heap[left] ? right : left;
      if (heap[at] >= heap[child]) return;
      [heap[at], heap[child]] = [heap[child], heap[at]];
      at = child;
    }
  };
  const fixedHash = (text, size) => [...text].reduce((sum, c) => sum + c.charCodeAt(0), 0) % size;

  const factories = {
    "linked-list": () => {
      let values = ["A", "B", "C"], next = 1;
      return {
        actions: [
          ["push_front", () => { const v = `F${next++}`; values.unshift(v); return `Linked ${v} before the old head.`; }],
          ["push_back", () => { const v = `B${next++}`; values.push(v); return `Linked ${v} after the old tail.`; }],
          ["pop_front", () => values.length ? `Unlinked ${values.shift()}; repaired the new head.` : "The list is empty."],
          ["pop_back", () => values.length ? `Unlinked ${values.pop()}; repaired the new tail.` : "The list is empty."],
        ],
        reset: () => { values = ["A", "B", "C"]; next = 1; },
        view: () => cells(values.flatMap((v, i) => [item(v, v, i === 0), i < values.length - 1 ? `<span class="ds-arrow">⇄</span>` : ""])) + label(`head ${values[0] ?? "—"} · tail ${values.at(-1) ?? "—"}`),
      };
    },
    "binary-heap": () => {
      let heap = [90, 50, 70, 20], incoming = [80, 65, 95, 35], cursor = 0;
      return {
        actions: [
          ["push", () => { const value = incoming[cursor++ % incoming.length]; heap.push(value); heapUp(heap, heap.length - 1); return `Pushed ${value} and bubbled it upward.`; }],
          ["pop max", () => { if (!heap.length) return "The heap is empty."; const max = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; heapDown(heap, 0); } return `Removed maximum ${max} and repaired downward.`; }],
        ],
        reset: () => { heap = [90, 50, 70, 20]; cursor = 0; },
        view: () => cells(heap.map((v, i) => item(v, v, i === 0))) + label(`array [${heap.join(", ")}] · root is maximum`),
      };
    },
    vec: () => {
      let values = [10, 20, 30], capacity = 4, next = 40;
      return {
        actions: [
          ["push", () => { if (values.length === capacity) capacity *= 2; values.push(next); return `Pushed ${next++}; ${values.length === capacity / 2 + 1 ? "allocation grew" : "used spare capacity"}.`; }],
          ["remove front", () => values.length ? `Removed ${values.shift()}; shifted every later element.` : "The vector is empty."],
          ["pop", () => values.length ? `Popped ${values.pop()} from the back.` : "The vector is empty."],
        ],
        reset: () => { values = [10, 20, 30]; capacity = 4; next = 40; },
        view: () => cells([...values.map(v => item(v, v)), ...Array.from({ length: capacity - values.length }, (_, i) => item("·", `empty-${i}`, false, "empty"))]) + label(`len ${values.length} · capacity ${capacity}`),
      };
    },
    "hash-map": () => mapLike(false),
    "hash-set": () => mapLike(true),
    "btree-map": () => orderedLike(true),
    "btree-set": () => orderedLike(false),
    arena: () => {
      let slots = [{v:"A",g:0},{v:"B",g:0},{v:"C",g:0}], free = [], next = "D", stale = null;
      return {
        actions: [
          ["insert", () => { const index = free.length ? free.pop() : slots.length; if (!slots[index]) slots[index]={v:null,g:0}; slots[index].v=next; const message=`Inserted ${next} as handle (${index},${slots[index].g}).`; next=String.fromCharCode(next.charCodeAt(0)+1); return message; }],
          ["remove first", () => { const index=slots.findIndex(s=>s.v!==null); if(index<0)return "No live slot."; stale=[index,slots[index].g]; const old=slots[index].v; slots[index].v=null; slots[index].g++; free.push(index); return `Removed ${old}; old handle (${stale}) is now stale.`; }],
          ["check stale", () => !stale ? "Remove a value first." : slots[stale[0]].g === stale[1] ? "Handle valid." : `Rejected (${stale}): generation is now ${slots[stale[0]].g}.`],
        ],
        reset: () => { slots=[{v:"A",g:0},{v:"B",g:0},{v:"C",g:0}]; free=[]; next="D"; stale=null; },
        view: () => cells(slots.map((s,i)=>item(s.v ?? "empty", `slot-${i}`, false, s.v===null?"empty":"")))+label(slots.map((s,i)=>`${i}:g${s.g}`).join(" · ")),
      };
    },
    graph: () => {
      const graph=[[1,2],[3],[3],[]]; let queue=[0], seen=new Set([0]), order=[];
      return {
        actions:[["visit next",()=>{if(!queue.length)return "Traversal complete.";const n=queue.shift();order.push(n);for(const x of graph[n])if(!seen.has(x)){seen.add(x);queue.push(x);}return `Visited ${n}; discovered [${graph[n].filter(x=>!order.includes(x)).join(", ")}].`; }]],
        reset:()=>{queue=[0];seen=new Set([0]);order=[];},
        view:()=>cells([0,1,2,3].map(n=>item(n,n,queue[0]===n,seen.has(n)?"":"empty")))+label(`queue [${queue}] · order [${order}]`),
      };
    },
    "union-find": () => {
      let parent=[0,1,2,3,4], pairs=[[0,1],[2,3],[1,2],[3,4]], cursor=0;
      const find=x=>{if(parent[x]!==x)parent[x]=find(parent[x]);return parent[x];};
      return {
        actions:[["union next",()=>{const [a,b]=pairs[cursor++%pairs.length],ra=find(a),rb=find(b);if(ra!==rb)parent[rb]=ra;return `union(${a}, ${b}) connected roots ${ra} and ${rb}.`; }],["find 3",()=>`find(3) compressed its path to root ${find(3)}.`]],
        reset:()=>{parent=[0,1,2,3,4];cursor=0;},
        view:()=>cells(parent.map((p,i)=>item(`${i}→${p}`,i,p===i)))+label(`parents [${parent}]`),
      };
    },
    trie: () => {
      let words=[], sequence=["cat","car","dog"], cursor=0, query="ca";
      return {
        actions:[["insert word",()=>{const w=sequence[cursor++%sequence.length];if(!words.includes(w))words.push(w);return `Inserted ${w}; shared prefixes reuse nodes.`;}],["query prefix",()=>`Prefix ${query}: ${words.filter(w=>w.startsWith(query)).join(", ")||"no matches"}.`]],
        reset:()=>{words=[];cursor=0;query="ca";},
        view:()=>cells(words.length?words.map(w=>item(w,w,w.startsWith(query))):[item("root","root",true)])+label(`stored {${words.join(", ")}} · prefix ${query}`),
      };
    },
    "bit-set": () => {
      let set=new Set(), seq=[2,6,3,7], cursor=0;
      return {
        actions:[["toggle next",()=>{const v=seq[cursor++%seq.length];if(set.has(v)){set.delete(v);return `Cleared bit ${v}.`;}set.add(v);return `Set bit ${v}.`;}],["clear",()=>{set.clear();return "Cleared every word.";}]],
        reset:()=>{set=new Set();cursor=0;},
        view:()=>cells(Array.from({length:8},(_,i)=>item(`${i}:${set.has(i)?1:0}`,i,set.has(i))))+label(`members {${[...set].sort().join(", ")}}`),
      };
    },
    bloom: () => bloomDemo(),
    lru: () => {
      let order=["A","B","C"], seq=["A","D","C","E"], cursor=0;
      return {
        actions:[["access next",()=>{const key=seq[cursor++%seq.length],at=order.indexOf(key);if(at>=0){order.splice(at,1);order.push(key);return `Hit ${key}; moved it to MRU.`;}const evicted=order.shift();order.push(key);return `Miss ${key}; evicted LRU ${evicted}.`;}]],
        reset:()=>{order=["A","B","C"];cursor=0;},
        view:()=>cells(order.map((v,i)=>item(v,v,i===order.length-1)))+label(`LRU ${order[0]} ← order → MRU ${order.at(-1)}`),
      };
    },
    monotonic: () => monotonicDemo(),
    ring: () => ringDemo(),
    "indexed-heap": () => indexedDemo(),
    intervals: () => intervalDemo(),
  };

  function mapLike(setOnly) {
    let entries=[], sequence=[["alice",10],["bob",20],["carol",30],["dave",40]], cursor=0, buckets=5;
    return {
      actions:[["insert",()=>{const [k,v]=sequence[cursor++%sequence.length],at=entries.findIndex(e=>e[0]===k);if(at>=0)entries[at][1]=v;else entries.push([k,v]);return `Hashed ${k} into bucket ${fixedHash(k,buckets)}.`;}],["remove first",()=>entries.length?`Removed ${entries.shift()[0]}.`:"Empty."]],
      reset:()=>{entries=[];cursor=0;},
      view:()=>cells(Array.from({length:buckets},(_,i)=>{const found=entries.filter(e=>fixedHash(e[0],buckets)===i);return item(`${i}: ${found.map(e=>setOnly?e[0]:`${e[0]}=${e[1]}`).join(" · ")||"·"}`,`bucket-${i}`,found.length>0,found.length?"":"empty");}))+label(setOnly?"unique keys only":"hash narrows; equality confirms"),
    };
  }

  function orderedLike(map) {
    let entries=[], sequence=[[40,"d"],[10,"a"],[30,"c"],[20,"b"]], cursor=0;
    return {
      actions:[["insert",()=>{const e=sequence[cursor++%sequence.length];if(!entries.some(x=>x[0]===e[0]))entries.push(e);entries.sort((a,b)=>a[0]-b[0]);return `Inserted ${e[0]} and rebalanced while preserving order.`;}],["remove middle",()=>entries.length?`Removed ${entries.splice(Math.floor(entries.length/2),1)[0][0]}.`:"Empty."]],
      reset:()=>{entries=[];cursor=0;},
      view:()=>cells(entries.length?entries.map(e=>item(map?`${e[0]}:${e[1]}`:e[0],e[0])):[item("empty","empty",false,"empty")])+label(`ordered keys [${entries.map(e=>e[0])}]`),
    };
  }

  function bloomDemo() {
    let bits=Array(12).fill(false), words=["alice","bob"], cursor=0, query="zoe";
    const indices=w=>[0,1,2].map(seed=>fixedHash(`${seed}${w}`,bits.length));
    return {
      actions:[["insert",()=>{const w=words[cursor++%words.length],at=indices(w);at.forEach(i=>bits[i]=true);return `Inserted ${w}; set bits ${at.join(", ")}.`;}],["query zoe",()=>{const at=indices(query),maybe=at.every(i=>bits[i]);return `${query}: bits ${at.join(", ")} → ${maybe?"possibly present":"definitely absent"}.`; }]],
      reset:()=>{bits=Array(12).fill(false);cursor=0;},
      view:()=>cells(bits.map((v,i)=>item(`${i}:${v?1:0}`,i,v)))+label("all queried bits must be one"),
    };
  }

  function monotonicDemo() {
    const input=[1,3,-1,-3,5,3,6,7], width=3;let index=0,deque=[],result=[];
    return {
      actions:[["consume next",()=>{if(index===input.length)return "Stream complete.";while(deque.length&&deque[0]+width<=index)deque.shift();while(deque.length&&input[deque.at(-1)]<=input[index])deque.pop();deque.push(index);const value=input[index++];if(index>=width)result.push(input[deque[0]]);return `Consumed ${value}; removed candidates that cannot win.`;}]],
      reset:()=>{index=0;deque=[];result=[];},
      view:()=>cells(deque.map(i=>item(input[i],`input-${i}`,i===deque[0])))+label(`next index ${index} · maxima [${result}]`),
    };
  }

  function ringDemo() {
    let slots=Array(5).fill(null),head=0,len=0,next=10;
    return {
      actions:[["push",()=>{const at=(head+len)%slots.length,value=next;next+=10;if(len<slots.length){slots[at]=value;len++;return `Wrote ${value} at slot ${at}.`;}const old=slots[head];slots[head]=value;head=(head+1)%slots.length;return `Overwrote ${old}; head advanced.`;}],["pop",()=>{if(!len)return "Empty.";const old=slots[head];slots[head]=null;head=(head+1)%slots.length;len--;return `Removed ${old} from the head.`;}]],
      reset:()=>{slots=Array(5).fill(null);head=0;len=0;next=10;},
      view:()=>cells(slots.map((v,i)=>item(v??"·",`slot-${i}`,len>0&&i===head,v===null?"empty":"")))+label(`head ${head} · len ${len} · capacity 5`),
    };
  }

  function indexedDemo() {
    let heap=[{k:"deploy",p:5},{k:"compile",p:2}], high=true;
    const repair=()=>heap.sort((a,b)=>b.p-a.p);
    return {
      actions:[["update compile",()=>{const e=heap.find(e=>e.k==="compile");e.p=high?8:1;high=!high;repair();return `Changed compile to ${e.p}; repaired heap and position map.`;}],["add test",()=>{if(!heap.some(e=>e.k==="test"))heap.push({k:"test",p:6});repair();return "Added test:6 and recorded its index.";}]],
      reset:()=>{heap=[{k:"deploy",p:5},{k:"compile",p:2}];high=true;},
      view:()=>cells(heap.map((e,i)=>item(`${e.k}:${e.p}`,e.k,i===0)))+label(heap.map((e,i)=>`${e.k}→${i}`).join(" · ")),
    };
  }

  function intervalDemo() {
    let ranges=[], seq=[[5,8],[1,3],[2,6],[10,12]], cursor=0;
    const merge=()=>{const sorted=[...ranges].sort((a,b)=>a[0]-b[0]),out=[];for(const r of sorted){const last=out.at(-1);if(last&&r[0]<=last[1])last[1]=Math.max(last[1],r[1]);else out.push([...r]);}return out;};
    return {
      actions:[["add interval",()=>{const r=seq[cursor++%seq.length];ranges.push([...r]);return `Added [${r}); intervals may now overlap.`;}],["merge",()=>{ranges=merge();return "Sorted and merged every overlapping range.";}]],
      reset:()=>{ranges=[];cursor=0;},
      view:()=>cells(ranges.length?ranges.map((r,i)=>item(`[${r})`,`${r}-${i}`)):[item("no intervals","empty",false,"empty")])+label("half-open ranges [start, end)"),
    };
  }

  document.querySelectorAll(".ds-demo[data-demo]").forEach((root) => {
    const make = factories[root.dataset.demo];
    if (!make) return;
    const demo = make();
    root.innerHTML = `<div class="ds-demo-stage"><div class="ds-demo-visual"></div></div><div class="ds-demo-status" aria-live="polite">Choose an operation.</div><div class="ds-demo-controls"></div>`;
    const controls = root.querySelector(".ds-demo-controls");
    demo.actions.forEach(([name, action]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = name;
      button.addEventListener("click", () => {
        root.querySelector(".ds-demo-status").textContent = action();
        place(root, demo.view());
      });
      controls.append(button);
    });
    const reset = document.createElement("button");
    reset.type = "button";
    reset.textContent = "Reset";
    reset.addEventListener("click", () => {
      demo.reset();
      root.querySelector(".ds-demo-status").textContent = "Reset to the initial state.";
      place(root, demo.view());
    });
    controls.append(reset);
    place(root, demo.view());
  });
})();

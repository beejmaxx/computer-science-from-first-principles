# 12. Tries — Prefix Lookup

A trie stores keys one symbol at a time. Keys with a common prefix share the
same path.

<div class="ds-demo" data-demo="trie"></div>

## When to use a trie

Use one for prefix search, autocomplete, routing tables, dictionaries, and
longest-prefix matching. Use a hash map when only complete-key lookup matters;
tries often consume substantially more memory.

## 1. Mental model

```text
root
 └─ c
    ├─ a ─ t*       "cat"
    └─ o ─ w*       "cow"
```

The terminal marker distinguishes a stored word from a prefix.

## 2. A character trie

```rust
use std::collections::HashMap;

#[derive(Default)]
struct Node {
    terminal: bool,
    children: HashMap<char, Node>,
}

#[derive(Default)]
struct Trie {
    root: Node,
}

impl Trie {
    fn insert(&mut self, word: &str) {
        let mut node = &mut self.root;
        for character in word.chars() {
            node = node.children.entry(character).or_default();
        }
        node.terminal = true;
    }

    fn contains(&self, word: &str) -> bool {
        self.find(word).is_some_and(|node| node.terminal)
    }

    fn has_prefix(&self, prefix: &str) -> bool {
        self.find(prefix).is_some()
    }

    fn find(&self, text: &str) -> Option<&Node> {
        let mut node = &self.root;
        for character in text.chars() {
            node = node.children.get(&character)?;
        }
        Some(node)
    }
}

fn main() {
    let mut trie = Trie::default();
    trie.insert("cat");
    trie.insert("car");

    assert!(trie.contains("cat"));
    assert!(!trie.contains("ca"));
    assert!(trie.has_prefix("ca"));
    assert!(!trie.has_prefix("dog"));
}
```

Lookup costs `O(k)` for a key of `k` symbols, independent of the number of
stored keys. The constant cost depends heavily on child representation.

## 3. Representation choices

- `HashMap<char, Node>` handles sparse alphabets flexibly.
- A fixed child array is faster but wastes space for sparse nodes.
- Radix trees compress chains of single-child nodes.
- Byte tries operate on encodings; character tries operate on Unicode scalar
  values, which are not necessarily user-perceived characters.

## 4. What you should internalize

Tries exchange memory for prefix-oriented operations. The alphabet and child
representation usually matter more than the high-level algorithm.

## Exercise

Add `words_with_prefix(prefix)` and return results in deterministic order.
Test a prefix that is itself a stored word as well as a prefix with no matches.

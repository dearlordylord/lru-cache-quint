import type { Action } from "@lru-cache-viz/core";

export const defaultPreset = (capacity: number): Action[] => {
  const actions: Action[] = [];
  // Insert keys 1..capacity
  for (let i = 1; i <= capacity; i++) {
    actions.push({ type: "insert", key: i, value: i * 10 });
  }
  // Access key 1 (moves to MRU)
  actions.push({ type: "access", key: 1 });
  // Insert capacity+1 (evicts LRU = key 2)
  actions.push({ type: "insert", key: capacity + 1, value: (capacity + 1) * 10 });
  // Insert capacity+2 (evicts next LRU = key 3)
  actions.push({ type: "insert", key: capacity + 2, value: (capacity + 2) * 10 });
  // Access key 1 again
  actions.push({ type: "access", key: 1 });
  // Insert key 2 back (evicts LRU)
  actions.push({ type: "insert", key: 2, value: 20 });
  return actions;
};

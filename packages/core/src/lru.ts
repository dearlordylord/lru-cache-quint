import { NIL, type LRUState } from "./state.js";
import { addToFront, evictNode, moveToFront } from "./dll.js";

export const init = (capacity: number): LRUState => ({
  data: new Map(),
  nxt: new Map(),
  prv: new Map(),
  hd: NIL,
  tl: NIL,
  capacity,
});

export const access = (state: LRUState, key: number): LRUState => {
  if (!state.data.has(key)) return state;
  const dll = moveToFront(state, key);
  return { ...dll, data: state.data, capacity: state.capacity };
};

export const insert = (state: LRUState, key: number, value: number): LRUState => {
  if (state.data.has(key)) {
    const dll = moveToFront(state, key);
    return { ...dll, data: new Map(state.data).set(key, value), capacity: state.capacity };
  }
  if (state.data.size >= state.capacity) {
    const evictKey = state.tl;
    const dll = addToFront(evictNode(state, evictKey), key);
    const data = new Map([...state.data].filter(([k]) => k !== evictKey));
    data.set(key, value);
    return { ...dll, data, capacity: state.capacity };
  }
  const dll = addToFront(state, key);
  return { ...dll, data: new Map(state.data).set(key, value), capacity: state.capacity };
};

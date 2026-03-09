import { NIL, type DLLState } from "./state.js";

const getOr = (map: ReadonlyMap<number, number>, key: number, def: number): number =>
  map.get(key) ?? def;

const mapDelete = (map: ReadonlyMap<number, number>, key: number): Map<number, number> =>
  new Map([...map].filter(([k]) => k !== key));

export const removeNode = (dll: DLLState, k: number): DLLState => {
  const p = getOr(dll.prv, k, NIL);
  const n = getOr(dll.nxt, k, NIL);
  return {
    nxt: p !== NIL ? new Map(dll.nxt).set(p, n) : dll.nxt,
    prv: n !== NIL ? new Map(dll.prv).set(n, p) : dll.prv,
    hd: dll.hd === k ? n : dll.hd,
    tl: dll.tl === k ? p : dll.tl,
  };
};

export const evictNode = (dll: DLLState, k: number): DLLState => {
  const dll1 = removeNode(dll, k);
  return { ...dll1, nxt: mapDelete(dll1.nxt, k), prv: mapDelete(dll1.prv, k) };
};

export const addToFront = (dll: DLLState, k: number): DLLState => {
  const prv1 = dll.hd !== NIL ? new Map(dll.prv).set(dll.hd, k) : new Map(dll.prv);
  return {
    nxt: new Map(dll.nxt).set(k, dll.hd),
    prv: prv1.set(k, NIL),
    hd: k,
    tl: dll.tl === NIL ? k : dll.tl,
  };
};

export const moveToFront = (dll: DLLState, k: number): DLLState =>
  dll.hd === k ? dll : addToFront(removeNode(dll, k), k);

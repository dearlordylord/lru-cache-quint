import { describe, it } from "vitest";
import { fileURLToPath } from "node:url";
import { run, pick, decodeBigInt, decodeMap } from "@firfi/quint-connect";
import { init, access, insert } from "../src/lru.js";
import type { LRUState } from "../src/state.js";

const spec = fileURLToPath(new URL("../../../lru_cache.qnt", import.meta.url));

const decodeNum = (raw: unknown): number => Number(decodeBigInt(raw));

const decodeNumMap = (raw: unknown): ReadonlyMap<number, number> =>
  decodeMap(raw, decodeNum, decodeNum);

type SpecState = {
  data: ReadonlyMap<number, number>;
  nxt: ReadonlyMap<number, number>;
  prv: ReadonlyMap<number, number>;
  hd: number;
  tl: number;
};

const deserializeState = (raw: unknown): SpecState => {
  const s = raw as Record<string, unknown>;
  return {
    data: decodeNumMap(s["lru_cache_test::lru_cache::data"]),
    nxt: decodeNumMap(s["lru_cache_test::lru_cache::nxt"]),
    prv: decodeNumMap(s["lru_cache_test::lru_cache::prv"]),
    hd: decodeNum(s["lru_cache_test::lru_cache::hd"]),
    tl: decodeNum(s["lru_cache_test::lru_cache::tl"]),
  };
};

const mapsEqual = (a: ReadonlyMap<number, number>, b: ReadonlyMap<number, number>): boolean => {
  if (a.size !== b.size) return false;
  for (const [k, v] of a) {
    if (b.get(k) !== v) return false;
  }
  return true;
};

const compareState = (spec: SpecState, impl: SpecState): boolean =>
  spec.hd === impl.hd &&
  spec.tl === impl.tl &&
  mapsEqual(spec.data, impl.data) &&
  mapsEqual(spec.nxt, impl.nxt) &&
  mapsEqual(spec.prv, impl.prv);

const createDriver = () => {
  let state: LRUState = init(3);
  return {
    step(step: { action: string; nondetPicks: ReadonlyMap<string, unknown>; rawState: Record<string, unknown> }) {
      switch (step.action) {
        case "access": {
          const k = pick(step, "k", decodeBigInt);
          if (k !== undefined) state = access(state, Number(k));
          break;
        }
        case "insert": {
          const k = pick(step, "k", decodeBigInt);
          const v = pick(step, "v", decodeBigInt);
          if (k !== undefined && v !== undefined)
            state = insert(state, Number(k), Number(v));
          break;
        }
      }
    },
    getState: (): SpecState => ({
      data: state.data,
      nxt: state.nxt,
      prv: state.prv,
      hd: state.hd,
      tl: state.tl,
    }),
  };
};

describe("LRU cache matches Quint spec", () => {
  it("replays 100 random traces", async () => {
    await run({
      spec,
      main: "lru_cache_test",
      nTraces: 100,
      maxSteps: 50,
      createDriver,
      stateCheck: { compareState, deserializeState },
    });
  });
});

import { describe, it } from "vitest";
import { fileURLToPath } from "node:url";
import { Effect, Schema } from "effect";
import { NodeContext } from "@effect/platform-node";
import { defineDriver, ITFBigInt, ITFMap, quintRun, stateCheck } from "@firfi/quint-connect/effect";
import { init, access, insert } from "../src/lru.js";

const spec = fileURLToPath(new URL("../../../lru_cache.qnt", import.meta.url));

const ITFNum = Schema.transform(ITFBigInt, Schema.Number, {
  decode: (b) => Number(b),
  encode: (n) => BigInt(n),
});

const ITFNumMap = Schema.transform(
  ITFMap(ITFBigInt, ITFBigInt),
  Schema.MapFromSelf({ key: Schema.Number, value: Schema.Number }),
  {
    decode: (m) => new Map([...m].map(([k, v]) => [Number(k), Number(v)])),
    encode: (m) => new Map([...m].map(([k, v]) => [BigInt(k), BigInt(v)])) as ReadonlyMap<bigint, bigint>,
  },
);

const RawStateSchema = Schema.Struct({
  "lru_cache_test::lru_cache::data": ITFNumMap,
  "lru_cache_test::lru_cache::nxt": ITFNumMap,
  "lru_cache_test::lru_cache::prv": ITFNumMap,
  "lru_cache_test::lru_cache::hd": ITFNum,
  "lru_cache_test::lru_cache::tl": ITFNum,
});

type SpecState = {
  data: Map<number, number>;
  nxt: Map<number, number>;
  prv: Map<number, number>;
  hd: number;
  tl: number;
};

const mapsEqual = (a: ReadonlyMap<number, number>, b: ReadonlyMap<number, number>): boolean => {
  if (a.size !== b.size) return false;
  for (const [k, v] of a) {
    if (b.get(k) !== v) return false;
  }
  return true;
};

const driverFactory = defineDriver(
  {
    access: { k: ITFNum },
    insert: { k: ITFNum, v: ITFNum },
  },
  () => {
    let state = init(3);
    return {
      access: ({ k }) => Effect.sync(() => { state = access(state, k); }),
      insert: ({ k, v }) => Effect.sync(() => { state = insert(state, k, v); }),
      getState: () => Effect.sync((): SpecState => ({
        data: new Map(state.data),
        nxt: new Map(state.nxt),
        prv: new Map(state.prv),
        hd: state.hd,
        tl: state.tl,
      })),
    };
  },
);

describe("LRU cache matches Quint spec", () => {
  it("replays 100 random traces", () =>
    Effect.runPromise(
      quintRun({
        spec,
        main: "lru_cache_test",
        nTraces: 100,
        maxSteps: 50,
        driverFactory,
        stateCheck: stateCheck(
          (raw) => Schema.decodeUnknown(RawStateSchema)(raw).pipe(
            Effect.map((s) => ({
              data: s["lru_cache_test::lru_cache::data"],
              nxt: s["lru_cache_test::lru_cache::nxt"],
              prv: s["lru_cache_test::lru_cache::prv"],
              hd: s["lru_cache_test::lru_cache::hd"],
              tl: s["lru_cache_test::lru_cache::tl"],
            })),
          ),
          (spec, impl) =>
            spec.hd === impl.hd &&
            spec.tl === impl.tl &&
            mapsEqual(spec.data, impl.data) &&
            mapsEqual(spec.nxt, impl.nxt) &&
            mapsEqual(spec.prv, impl.prv),
        ),
      }).pipe(Effect.provide(NodeContext.layer))
    ),
  60_000);
});

import type { LRUState } from "./state.js";
import { access, insert } from "./lru.js";

export type Action =
  | { type: "access"; key: number }
  | { type: "insert"; key: number; value: number };

export const reducer = (state: LRUState, action: Action): LRUState => {
  switch (action.type) {
    case "access":
      return access(state, action.key);
    case "insert":
      return insert(state, action.key, action.value);
  }
};

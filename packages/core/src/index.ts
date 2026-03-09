export { NIL, type DLLState, type LRUState } from "./state.js";
export { removeNode, evictNode, addToFront, moveToFront } from "./dll.js";
export { init, access, insert } from "./lru.js";
export { reducer, type Action } from "./reducer.js";
export {
  type History,
  create,
  apply,
  back,
  forward,
  jumpTo,
  current,
  canBack,
  canForward,
} from "./history.js";

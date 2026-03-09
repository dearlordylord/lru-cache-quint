export const NIL = -1;

export type DLLState = {
  readonly nxt: ReadonlyMap<number, number>;
  readonly prv: ReadonlyMap<number, number>;
  readonly hd: number;
  readonly tl: number;
};

export type LRUState = DLLState & {
  readonly data: ReadonlyMap<number, number>;
  readonly capacity: number;
};

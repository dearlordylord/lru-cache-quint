export type History<S> = {
  readonly states: readonly S[];
  readonly cursor: number;
};

export const create = <S>(initial: S): History<S> => ({
  states: [initial],
  cursor: 0,
});

export const apply = <S>(h: History<S>, fn: (s: S) => S): History<S> => {
  const current = h.states[h.cursor];
  const next = fn(current);
  return {
    states: [...h.states.slice(0, h.cursor + 1), next],
    cursor: h.cursor + 1,
  };
};

export const back = <S>(h: History<S>): History<S> =>
  h.cursor > 0 ? { ...h, cursor: h.cursor - 1 } : h;

export const forward = <S>(h: History<S>): History<S> =>
  h.cursor < h.states.length - 1 ? { ...h, cursor: h.cursor + 1 } : h;

export const jumpTo = <S>(h: History<S>, i: number): History<S> =>
  i >= 0 && i < h.states.length ? { ...h, cursor: i } : h;

export const current = <S>(h: History<S>): S => h.states[h.cursor];

export const canBack = <S>(h: History<S>): boolean => h.cursor > 0;

export const canForward = <S>(h: History<S>): boolean => h.cursor < h.states.length - 1;

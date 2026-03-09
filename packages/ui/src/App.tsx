import { useState, useCallback } from "react";
import {
  init,
  reducer,
  type Action,
  type LRUState,
  type History,
  create,
  apply,
  back as histBack,
  forward as histForward,
  jumpTo as histJumpTo,
  current,
  canBack as histCanBack,
  canForward as histCanForward,
} from "@lru-cache-viz/core";
import { defaultPreset } from "./preset";
import { DLLView } from "./components/DLLView";
import { MapView } from "./components/MapView";
import { Controls } from "./components/Controls";
import { ActionLog } from "./components/ActionLog";
import "./App.css";

const DEFAULT_CAPACITY = 3;

export function App() {
  const [capacity, setCapacity] = useState(DEFAULT_CAPACITY);
  const [history, setHistory] = useState<History<LRUState>>(() => create(init(capacity)));
  const [actions, setActions] = useState<Action[]>([]);
  const [presetActions] = useState(() => defaultPreset(DEFAULT_CAPACITY));
  const [presetIndex, setPresetIndex] = useState(0);

  const state = current(history);

  const applyAction = useCallback((action: Action) => {
    setHistory(h => {
      const newH = apply(h, s => reducer(s, action));
      // truncate actions in sync
      setActions(prev => [...prev.slice(0, h.cursor), action]);
      return newH;
    });
  }, []);

  const back = useCallback(() => setHistory(histBack), []);
  const forward = useCallback(() => setHistory(histForward), []);

  const jump = useCallback((i: number) => {
    setHistory(h => histJumpTo(h, i));
  }, []);

  const reset = useCallback(() => {
    setHistory(create(init(capacity)));
    setActions([]);
    setPresetIndex(0);
  }, [capacity]);

  const applyNextPreset = useCallback(() => {
    if (presetIndex >= presetActions.length) return;
    const action = presetActions[presetIndex];
    applyAction(action);
    setPresetIndex(i => i + 1);
  }, [presetIndex, presetActions, applyAction]);

  const handleCapacityChange = useCallback((cap: number) => {
    setCapacity(cap);
    setHistory(create(init(cap)));
    setActions([]);
    setPresetIndex(0);
  }, []);

  return (
    <div className="app">
      <h1>LRU Cache Visualizer</h1>
      <p className="subtitle">Verified against Quint formal specification</p>

      <section className="section">
        <h2>Doubly Linked List (head &rarr; tail)</h2>
        <DLLView state={state} />
      </section>

      <section className="section">
        <MapView state={state} />
      </section>

      <Controls
        canBack={histCanBack(history)}
        canForward={histCanForward(history)}
        hasPreset={presetIndex < presetActions.length}
        capacity={capacity}
        onBack={back}
        onForward={forward}
        onApplyPreset={applyNextPreset}
        onReset={reset}
        onAction={applyAction}
        onCapacityChange={handleCapacityChange}
      />

      <ActionLog
        actions={actions}
        cursor={history.cursor}
        onJump={jump}
      />
    </div>
  );
}

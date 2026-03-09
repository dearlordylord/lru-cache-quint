import { useState } from "react";
import type { Action } from "@lru-cache-viz/core";

type Props = {
  canBack: boolean;
  canForward: boolean;
  hasPreset: boolean;
  capacity: number;
  onBack: () => void;
  onForward: () => void;
  onApplyPreset: () => void;
  onReset: () => void;
  onAction: (action: Action) => void;
  onCapacityChange: (cap: number) => void;
};

export function Controls({
  canBack, canForward, hasPreset, capacity,
  onBack, onForward, onApplyPreset, onReset, onAction, onCapacityChange,
}: Props) {
  const [actionType, setActionType] = useState<"access" | "insert">("insert");
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const k = parseInt(key, 10);
    if (isNaN(k)) return;
    if (actionType === "access") {
      onAction({ type: "access", key: k });
    } else {
      const v = parseInt(value, 10);
      if (isNaN(v)) return;
      onAction({ type: "insert", key: k, value: v });
    }
    setKey("");
    setValue("");
  };

  return (
    <div className="controls">
      <div className="controls-nav">
        <button onClick={onBack} disabled={!canBack}>&larr; Back</button>
        <button onClick={onForward} disabled={!canForward}>Forward &rarr;</button>
        <button onClick={onApplyPreset} disabled={!hasPreset}>Next Preset</button>
        <button onClick={onReset}>Reset</button>
      </div>
      <form className="controls-form" onSubmit={handleSubmit}>
        <select value={actionType} onChange={e => setActionType(e.target.value as "access" | "insert")}>
          <option value="insert">insert</option>
          <option value="access">access</option>
        </select>
        <input type="number" placeholder="key" value={key} onChange={e => setKey(e.target.value)} required />
        {actionType === "insert" && (
          <input type="number" placeholder="value" value={value} onChange={e => setValue(e.target.value)} required />
        )}
        <button type="submit">Apply</button>
      </form>
      <div className="controls-capacity">
        <label>
          Capacity:
          <input
            type="number"
            min={1}
            max={20}
            value={capacity}
            onChange={e => {
              const v = parseInt(e.target.value, 10);
              if (!isNaN(v) && v >= 1) onCapacityChange(v);
            }}
          />
        </label>
      </div>
    </div>
  );
}

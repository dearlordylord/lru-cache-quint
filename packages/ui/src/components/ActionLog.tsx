import type { Action } from "@lru-cache-viz/core";

function describeAction(action: Action): string {
  if (action.type === "access") return `access(${action.key})`;
  return `insert(${action.key}, ${action.value})`;
}

type Props = {
  actions: readonly Action[];
  cursor: number;
  onJump: (index: number) => void;
};

export function ActionLog({ actions, cursor, onJump }: Props) {
  return (
    <div className="action-log">
      <h3>Action Log</h3>
      <div className="action-log-list">
        <div
          className={`action-log-entry ${cursor === 0 ? "active" : cursor > 0 ? "" : "future"}`}
          onClick={() => onJump(0)}
        >
          0: init
        </div>
        {actions.map((action, i) => {
          const stateIndex = i + 1;
          const isCurrent = cursor === stateIndex;
          const isFuture = stateIndex > cursor;
          return (
            <div
              key={i}
              className={`action-log-entry ${isCurrent ? "active" : isFuture ? "future" : ""}`}
              onClick={() => onJump(stateIndex)}
            >
              {stateIndex}: {describeAction(action)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

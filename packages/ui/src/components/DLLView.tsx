import { NIL, type LRUState } from "@lru-cache-viz/core";

export function DLLView({ state }: { state: LRUState }) {
  const nodes: { key: number; value: number }[] = [];
  let cur = state.hd;
  const seen = new Set<number>();
  while (cur !== NIL && !seen.has(cur)) {
    seen.add(cur);
    const value = state.data.get(cur);
    if (value !== undefined) nodes.push({ key: cur, value });
    cur = state.nxt.get(cur) ?? NIL;
  }

  if (nodes.length === 0) {
    return <div className="dll-view"><span className="dll-empty">Empty</span></div>;
  }

  return (
    <div className="dll-view">
      {nodes.map((node, i) => (
        <span key={node.key} style={{ display: "inline-flex", alignItems: "center" }}>
          <span
            className="dll-node"
            style={{
              border: `2px solid ${i === 0 ? "#22c55e" : i === nodes.length - 1 ? "#ef4444" : "#6b7280"}`,
            }}
          >
            <strong>{node.key}</strong>
            <span className="dll-node-value">{node.value}</span>
          </span>
          {i < nodes.length - 1 && <span className="dll-arrow">&rarr;</span>}
        </span>
      ))}
      <div className="dll-labels">
        <span style={{ color: "#22c55e" }}>MRU</span>
        <span style={{ color: "#ef4444" }}>LRU</span>
      </div>
    </div>
  );
}

import type { LRUState } from "@lru-cache-viz/core";

export function MapView({ state }: { state: LRUState }) {
  const entries = [...state.data].sort(([a], [b]) => a - b);

  return (
    <div className="map-view">
      <h3>Data Map ({state.data.size}/{state.capacity})</h3>
      <table>
        <thead>
          <tr><th>Key</th><th>Value</th></tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr><td colSpan={2}>Empty</td></tr>
          ) : (
            entries.map(([k, v]) => (
              <tr key={k}><td>{k}</td><td>{v}</td></tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

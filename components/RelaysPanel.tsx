import { useAppStore } from "@/state/store";

type RelaysPanelProps = {
  canControl: boolean;
  baseTopic: string;
  onPublish: (topic: string, payload: string) => void;
};

export function RelaysPanel({ canControl, baseTopic, onPublish }: RelaysPanelProps) {
  const { relays } = useAppStore();
  const relayRows = Object.entries(relays).flatMap(([deviceId, relayMap]) =>
    Object.values(relayMap).map((relay) => ({ deviceId, relay }))
  );

  return (
    <section className="panel p-4">
      <h2 className="text-lg font-medium mb-3">Relays</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        <button disabled={!canControl} onClick={() => onPublish(baseTopic, "ON")} className="px-3 py-2 rounded-lg bg-emerald-600 disabled:opacity-40">
          All ON
        </button>
        <button disabled={!canControl} onClick={() => onPublish(baseTopic, "OFF")} className="px-3 py-2 rounded-lg bg-rose-600 disabled:opacity-40">
          All OFF
        </button>
        <button disabled={!canControl} onClick={() => onPublish(`${baseTopic}/ping`, "1")} className="px-3 py-2 rounded-lg bg-cyan-700 disabled:opacity-40">
          Ping
        </button>
      </div>

      {relayRows.length === 0 ? (
        <p className="text-slate-400 text-sm">No relay state received yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {relayRows.map(({ deviceId, relay }) => (
            <div key={`${deviceId}-${relay.id}`} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium">{relay.id}</div>
                  <div className="text-xs text-slate-400">{deviceId}</div>
                </div>
                <span className={relay.state ? "text-emerald-300" : "text-slate-400"}>{relay.state ? "ON" : "OFF"}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button disabled={!canControl} onClick={() => onPublish(relay.topic, "ON")} className="px-2 py-1 rounded bg-emerald-700 text-sm disabled:opacity-40">
                  ON
                </button>
                <button disabled={!canControl} onClick={() => onPublish(relay.topic, "OFF")} className="px-2 py-1 rounded bg-rose-700 text-sm disabled:opacity-40">
                  OFF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

import { useAppStore } from "@/state/store";

type WLEDPanelProps = {
  canControl: boolean;
  baseTopic: string;
  onPublish: (topic: string, payload: string) => void;
};

export function WLEDPanel({ canControl, baseTopic, onPublish }: WLEDPanelProps) {
  const { wled } = useAppStore();
  const rows = Object.entries(wled);

  return (
    <section className="panel p-4">
      <h2 className="text-lg font-medium mb-3">WLED</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        <button disabled={!canControl} onClick={() => onPublish(`${baseTopic}/wled/api`, JSON.stringify({ on: true }))} className="px-3 py-2 rounded-lg bg-emerald-600 disabled:opacity-40">
          Power ON
        </button>
        <button disabled={!canControl} onClick={() => onPublish(`${baseTopic}/wled/api`, JSON.stringify({ on: false }))} className="px-3 py-2 rounded-lg bg-slate-700 disabled:opacity-40">
          Power OFF
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-slate-400 text-sm">No WLED state received yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rows.map(([deviceId, state]) => (
            <div key={deviceId} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{deviceId}</div>
                  <div className="text-xs text-slate-400">{state.topic}</div>
                </div>
                <span className={state.power ? "text-emerald-300" : "text-slate-400"}>{state.power ? "ON" : "OFF"}</span>
              </div>
              <div className="mt-3 text-sm text-slate-300">Brightness: {state.brightness}</div>
              <div className="mt-1 text-sm text-slate-300">Effect: {state.effect}</div>
              <div className="mt-3 h-8 rounded border border-slate-800" style={{ backgroundColor: state.color }} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

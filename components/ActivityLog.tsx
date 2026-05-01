import type { MQTTLogEntry } from "@/hooks/useMQTT";

type ActivityLogProps = {
  logs: MQTTLogEntry[];
  onClear: () => void;
};

function formatTime(value: number) {
  return new Date(value).toLocaleTimeString();
}

function levelClass(level: MQTTLogEntry["level"]) {
  if (level === "error") return "text-rose-300";
  if (level === "warn") return "text-amber-200";
  return "text-slate-200";
}

export function ActivityLog({ logs, onClear }: ActivityLogProps) {
  return (
    <section className="panel p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">Activity Log</h3>
        <button onClick={onClear} className="text-sm text-slate-300 hover:text-white">
          Clear
        </button>
      </div>
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 h-56 overflow-auto text-xs font-mono space-y-1">
        {logs.length === 0 ? (
          <div className="text-slate-500">No log yet.</div>
        ) : (
          logs.map((line) => (
            <div key={`${line.at}-${line.message}`} className={levelClass(line.level)}>
              [{formatTime(line.at)}] {line.message}
            </div>
          ))
        )}
      </div>
    </section>
  );
}

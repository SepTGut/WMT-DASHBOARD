import type { ConnStatus } from "@/hooks/useMQTT";

type ConnectionPanelProps = {
  host: string;
  port: string;
  tls: boolean;
  username: string;
  password: string;
  baseTopic: string;
  status: ConnStatus;
  retryCount: number;
  connectedAt: number | null;
  onHostChange: (value: string) => void;
  onPortChange: (value: string) => void;
  onTlsChange: (value: boolean) => void;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onBaseTopicChange: (value: string) => void;
  onConnect: () => void;
  onDisconnect: () => void;
};

export function ConnectionPanel({
  host,
  port,
  tls,
  username,
  password,
  baseTopic,
  status,
  retryCount,
  connectedAt,
  onHostChange,
  onPortChange,
  onTlsChange,
  onUsernameChange,
  onPasswordChange,
  onBaseTopicChange,
  onConnect,
  onDisconnect
}: ConnectionPanelProps) {
  return (
    <section className="panel p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="text-lg font-medium">Broker Settings</h2>
          <p className="text-sm text-slate-400">
            Retries: {retryCount}
            {connectedAt ? ` · Connected ${new Date(connectedAt).toLocaleTimeString()}` : ""}
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="text-sm">
          Host
          <input value={host} onChange={(e) => onHostChange(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" />
        </label>
        <label className="text-sm">
          Port
          <input value={port} onChange={(e) => onPortChange(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" />
        </label>
        <label className="text-sm">
          Username
          <input value={username} onChange={(e) => onUsernameChange(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" />
        </label>
        <label className="text-sm">
          Password
          <input type="password" value={password} onChange={(e) => onPasswordChange(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" />
        </label>
        <label className="text-sm sm:col-span-2">
          Base Topic
          <input value={baseTopic} onChange={(e) => onBaseTopicChange(e.target.value)} className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2" />
        </label>
      </div>

      <label className="inline-flex items-center gap-2 mt-3 text-sm">
        <input type="checkbox" checked={tls} onChange={(e) => onTlsChange(e.target.checked)} />
        WSS / TLS
      </label>

      <div className="flex gap-2 mt-4">
        <button onClick={onConnect} disabled={status === "connecting" || status === "online"} className="px-3 py-2 rounded-lg bg-cyan-600 disabled:opacity-40">
          Connect
        </button>
        <button onClick={onDisconnect} disabled={status === "offline"} className="px-3 py-2 rounded-lg bg-slate-700 disabled:opacity-40">
          Disconnect
        </button>
      </div>
    </section>
  );
}

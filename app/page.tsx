"use client";

import { useMemo, useState } from "react";
import { ActivityLog } from "@/components/ActivityLog";
import { ConnectionPanel } from "@/components/ConnectionPanel";
import { RelaysPanel } from "@/components/RelaysPanel";
import { SensorsPanel } from "@/components/SensorsPanel";
import { WLEDPanel } from "@/components/WLEDPanel";
import { applyDomainEvent, normalizeMQTTMessage } from "@/lib/core-utils";
import { useMQTT } from "@/hooks/useMQTT";

type TabName = "relays" | "wled" | "sensors" | "settings";

function buttonClass(active: boolean) {
  return active
    ? "w-full text-left px-3 py-2 rounded-lg bg-cyan-500/20 text-cyan-200"
    : "w-full text-left px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800";
}

export default function Page() {
  const [tab, setTab] = useState<TabName>("relays");
  const [host, setHost] = useState("broker.hivemq.com");
  const [port, setPort] = useState("8884");
  const [tls, setTls] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [baseTopic, setBaseTopic] = useState("home/relay");

  const mqtt = useMQTT({
    onMessage: (message) => {
      applyDomainEvent(normalizeMQTTMessage(message));
    }
  });

  const canControl = mqtt.status === "online";

  const badgeClass = useMemo(() => {
    if (mqtt.status === "online") return "bg-emerald-500/20 text-emerald-300 border-emerald-600/40";
    if (mqtt.status === "connecting" || mqtt.status === "reconnecting") return "bg-amber-500/20 text-amber-200 border-amber-600/40";
    if (mqtt.status === "error") return "bg-rose-500/20 text-rose-200 border-rose-600/40";
    return "bg-slate-500/20 text-slate-200 border-slate-600/40";
  }, [mqtt.status]);

  function connect() {
    mqtt.connect({
      host,
      port: Number(port),
      tls,
      username,
      password,
      baseTopic
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <header className="flex items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">MQTT Controller</h1>
        <span className={`px-3 py-1 rounded-full text-sm border ${badgeClass}`}>{mqtt.status.toUpperCase()}</span>
      </header>

      <div className="grid md:grid-cols-[240px,1fr] gap-4">
        <aside className="panel p-2">
          <button onClick={() => setTab("relays")} className={buttonClass(tab === "relays")}>
            Relays
          </button>
          <button onClick={() => setTab("wled")} className={buttonClass(tab === "wled")}>
            WLED
          </button>
          <button onClick={() => setTab("sensors")} className={buttonClass(tab === "sensors")}>
            Sensors
          </button>
          <button onClick={() => setTab("settings")} className={buttonClass(tab === "settings")}>
            Settings
          </button>
        </aside>

        <main className="space-y-4">
          {tab === "relays" && <RelaysPanel canControl={canControl} baseTopic={baseTopic} onPublish={mqtt.publish} />}
          {tab === "wled" && <WLEDPanel canControl={canControl} baseTopic={baseTopic} onPublish={mqtt.publish} />}
          {tab === "sensors" && <SensorsPanel />}
          {tab === "settings" && (
            <ConnectionPanel
              host={host}
              port={port}
              tls={tls}
              username={username}
              password={password}
              baseTopic={baseTopic}
              status={mqtt.status}
              retryCount={mqtt.retryCount}
              connectedAt={mqtt.connectedAt}
              onHostChange={setHost}
              onPortChange={setPort}
              onTlsChange={setTls}
              onUsernameChange={setUsername}
              onPasswordChange={setPassword}
              onBaseTopicChange={setBaseTopic}
              onConnect={connect}
              onDisconnect={mqtt.disconnect}
            />
          )}

          <ActivityLog logs={mqtt.logs} onClear={mqtt.clearLogs} />
        </main>
      </div>
    </div>
  );
}

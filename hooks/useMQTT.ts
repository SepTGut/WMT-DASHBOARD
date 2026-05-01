"use client";

import mqtt, { type IClientOptions, type MqttClient } from "mqtt";
import { useCallback, useEffect, useRef, useState } from "react";

export type ConnStatus = "offline" | "connecting" | "online" | "reconnecting" | "error";

export type MQTTConfig = {
  host: string;
  port: number;
  tls: boolean;
  username?: string;
  password?: string;
  baseTopic: string;
};

export type MQTTMessage = {
  topic: string;
  payload: string;
  receivedAt: number;
};

export type MQTTLogEntry = {
  at: number;
  level: "info" | "warn" | "error";
  message: string;
};

type UseMQTTOptions = {
  onMessage?: (message: MQTTMessage) => void;
  maxLogEntries?: number;
};

function buildBrokerUrl(config: MQTTConfig) {
  const protocol = config.tls ? "wss" : "ws";
  return `${protocol}://${config.host}:${config.port}/mqtt`;
}

function normalizeBaseTopic(topic: string) {
  return topic.trim().replace(/^\/+|\/+$/g, "");
}

export function useMQTT({ onMessage, maxLogEntries = 200 }: UseMQTTOptions = {}) {
  const clientRef = useRef<MqttClient | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const shouldReconnectRef = useRef(false);
  const retryRef = useRef(0);
  const configRef = useRef<MQTTConfig | null>(null);

  const [status, setStatus] = useState<ConnStatus>("offline");
  const [retryCount, setRetryCount] = useState(0);
  const [connectedAt, setConnectedAt] = useState<number | null>(null);
  const [logs, setLogs] = useState<MQTTLogEntry[]>([]);

  const addLog = useCallback(
    (level: MQTTLogEntry["level"], message: string) => {
      setLogs((prev) => [...prev.slice(-(maxLogEntries - 1)), { at: Date.now(), level, message }]);
    },
    [maxLogEntries]
  );

  const clearLogs = useCallback(() => setLogs([]), []);

  const cleanupClient = useCallback(() => {
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    const client = clientRef.current;
    clientRef.current = null;

    if (client) {
      client.removeAllListeners();
      client.end(true);
    }
  }, []);

  const connect = useCallback(
    (config: MQTTConfig) => {
      const baseTopic = normalizeBaseTopic(config.baseTopic);

      if (!config.host.trim()) {
        addLog("error", "Host is required.");
        setStatus("error");
        return;
      }

      if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535) {
        addLog("error", "Invalid port.");
        setStatus("error");
        return;
      }

      if (!baseTopic) {
        addLog("error", "Base topic is required.");
        setStatus("error");
        return;
      }

      const normalizedConfig = { ...config, host: config.host.trim(), baseTopic };
      configRef.current = normalizedConfig;
      shouldReconnectRef.current = true;
      cleanupClient();

      const brokerUrl = buildBrokerUrl(normalizedConfig);
      const clientId = `wmt_dashboard_${Math.random().toString(16).slice(2, 10)}`;
      const options: IClientOptions = {
        clientId,
        clean: true,
        connectTimeout: 10_000,
        keepalive: 30,
        reconnectPeriod: 0,
        username: normalizedConfig.username || undefined,
        password: normalizedConfig.password || undefined
      };

      setStatus(retryRef.current > 0 ? "reconnecting" : "connecting");
      addLog("info", `Connecting to ${brokerUrl} ...`);

      const client = mqtt.connect(brokerUrl, options);
      clientRef.current = client;

      client.on("connect", () => {
        retryRef.current = 0;
        setRetryCount(0);
        setConnectedAt(Date.now());
        setStatus("online");
        addLog("info", "Connected.");
        client.subscribe(`${baseTopic}/#`, { qos: 0 }, (error) => {
          if (error) {
            addLog("error", `Subscribe failed: ${error.message}`);
            return;
          }
          addLog("info", `Subscribed: ${baseTopic}/#`);
        });
      });

      client.on("message", (topic, payload) => {
        const message = { topic, payload: payload.toString(), receivedAt: Date.now() };
        addLog("info", `RX ${message.topic}: ${message.payload}`);
        onMessage?.(message);
      });

      client.on("error", (error) => {
        addLog("error", error.message);
      });

      client.on("close", () => {
        if (!shouldReconnectRef.current) {
          setStatus("offline");
          return;
        }

        const nextRetry = retryRef.current + 1;
        retryRef.current = nextRetry;
        setRetryCount(nextRetry);
        setStatus("reconnecting");

        const delayMs = Math.min(30_000, 1_000 * 2 ** Math.min(nextRetry - 1, 5));
        addLog("warn", `Connection closed. Reconnecting in ${Math.round(delayMs / 1000)}s.`);
        reconnectTimerRef.current = window.setTimeout(() => {
          if (configRef.current && shouldReconnectRef.current) {
            connect(configRef.current);
          }
        }, delayMs);
      });
    },
    [addLog, cleanupClient, onMessage]
  );

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    retryRef.current = 0;
    setRetryCount(0);
    setConnectedAt(null);
    cleanupClient();
    setStatus("offline");
    addLog("info", "Disconnected.");
  }, [addLog, cleanupClient]);

  const publish = useCallback(
    (topic: string, payload: string) => {
      const client = clientRef.current;
      if (!client || status !== "online") {
        addLog("warn", "Not connected.");
        return false;
      }

      client.publish(topic, payload, { qos: 0 }, (error) => {
        if (error) {
          addLog("error", `Publish failed: ${error.message}`);
          return;
        }
        addLog("info", `TX ${topic}: ${payload}`);
      });

      return true;
    },
    [addLog, status]
  );

  useEffect(() => disconnect, [disconnect]);

  return {
    status,
    retryCount,
    connectedAt,
    logs,
    clearLogs,
    connect,
    disconnect,
    publish
  };
}

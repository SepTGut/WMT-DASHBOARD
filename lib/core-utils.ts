import type { MQTTMessage } from "@/hooks/useMQTT";
import { appStore, type RelayState, type SensorState, type WLEDState } from "@/state/store";

export type DomainEvent =
  | {
      kind: "relay:update";
      deviceId: string;
      relayId: string;
      state: boolean;
      rawValue: string;
      topic: string;
      receivedAt: number;
    }
  | {
      kind: "sensor:update";
      deviceId: string;
      sensorId: string;
      value: number | string;
      unit?: string;
      topic: string;
      receivedAt: number;
    }
  | {
      kind: "wled:update";
      deviceId: string;
      state: Partial<WLEDState>;
      topic: string;
      receivedAt: number;
    }
  | {
      kind: "unknown";
      topic: string;
      payload: string;
      receivedAt: number;
    };

function asRelayState(payload: string): boolean | null {
  const value = payload.trim().toLowerCase();

  if (["1", "on", "true", "255", "open", "high"].includes(value)) return true;
  if (["0", "off", "false", "close", "closed", "low"].includes(value)) return false;

  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric > 0;

  return null;
}

function parseJsonPayload(payload: string): unknown {
  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

function mapWLEDPayload(payload: string): Partial<WLEDState> {
  const json = parseJsonPayload(payload);
  if (json && typeof json === "object") {
    const source = json as Record<string, unknown>;
    const result: Partial<WLEDState> = {};

    if (typeof source.on === "boolean") result.power = source.on;
    if (typeof source.bri === "number") result.brightness = source.bri;
    if (typeof source.fx === "number") result.effect = source.fx;
    if (Array.isArray(source.seg)) {
      const firstSegment = source.seg[0] as Record<string, unknown> | undefined;
      const colors = firstSegment?.col;
      if (Array.isArray(colors) && Array.isArray(colors[0])) {
        result.color = `rgb(${colors[0].slice(0, 3).join(",")})`;
      }
    }

    return result;
  }

  const relayState = asRelayState(payload);
  return relayState === null ? {} : { power: relayState };
}

export function normalizeMQTTMessage(message: MQTTMessage): DomainEvent {
  const parts = message.topic.split("/").filter(Boolean);
  const payload = message.payload.trim();
  const loweredParts = parts.map((part) => part.toLowerCase());

  const sensorIndex = loweredParts.findIndex((part) => ["sensor", "sensors", "telemetry"].includes(part));
  if (sensorIndex >= 0) {
    const value = Number(payload);
    return {
      kind: "sensor:update",
      deviceId: parts[0] ?? "unknown",
      sensorId: parts[sensorIndex + 1] ?? parts.at(-1) ?? "value",
      value: Number.isFinite(value) ? value : payload,
      topic: message.topic,
      receivedAt: message.receivedAt
    };
  }

  const wledIndex = loweredParts.findIndex((part) => part === "wled");
  if (wledIndex >= 0 || loweredParts.includes("api")) {
    return {
      kind: "wled:update",
      deviceId: parts[0] ?? "wled",
      state: mapWLEDPayload(payload),
      topic: message.topic,
      receivedAt: message.receivedAt
    };
  }

  const relayState = asRelayState(payload);
  const relayIndex = loweredParts.findIndex((part) => ["relay", "relays", "setgt", "set"].includes(part));
  if (relayState !== null && parts.length >= 2) {
    return {
      kind: "relay:update",
      deviceId: parts[0],
      relayId: relayIndex >= 0 ? parts[relayIndex + 1] ?? parts.at(-1) ?? "main" : parts.at(-1) ?? "main",
      state: relayState,
      rawValue: payload,
      topic: message.topic,
      receivedAt: message.receivedAt
    };
  }

  return {
    kind: "unknown",
    topic: message.topic,
    payload: message.payload,
    receivedAt: message.receivedAt
  };
}

export function applyDomainEvent(event: DomainEvent) {
  if (event.kind === "relay:update") {
    const relay: RelayState = {
      id: event.relayId,
      state: event.state,
      rawValue: event.rawValue,
      lastUpdated: event.receivedAt,
      topic: event.topic
    };
    appStore.upsertRelay(event.deviceId, relay);
    return;
  }

  if (event.kind === "sensor:update") {
    const sensor: SensorState = {
      id: event.sensorId,
      value: event.value,
      unit: event.unit,
      lastUpdated: event.receivedAt,
      topic: event.topic
    };
    appStore.upsertSensor(event.deviceId, sensor);
    return;
  }

  if (event.kind === "wled:update") {
    appStore.upsertWLED(event.deviceId, {
      ...event.state,
      lastUpdated: event.receivedAt,
      topic: event.topic
    });
  }
}

"use client";

import { useSyncExternalStore } from "react";

export type DeviceType = "relay" | "sensor" | "wled" | "unknown";

export type DeviceState = {
  id: string;
  type: DeviceType;
  lastSeen: number;
};

export type RelayState = {
  id: string;
  state: boolean;
  rawValue: string;
  lastUpdated: number;
  topic: string;
};

export type SensorState = {
  id: string;
  value: number | string;
  unit?: string;
  lastUpdated: number;
  topic: string;
};

export type WLEDState = {
  power: boolean;
  brightness: number;
  color: string;
  effect: number;
  lastUpdated: number;
  topic: string;
};

export type AppState = {
  devices: Record<string, DeviceState>;
  relays: Record<string, Record<string, RelayState>>;
  sensors: Record<string, Record<string, SensorState>>;
  wled: Record<string, WLEDState>;
};

const initialState: AppState = {
  devices: {},
  relays: {},
  sensors: {},
  wled: {}
};

const defaultWLEDState = {
  power: false,
  brightness: 0,
  color: "rgb(255,255,255)",
  effect: 0
};

type Listener = () => void;

function createStore() {
  let state = initialState;
  const listeners = new Set<Listener>();

  function emit() {
    listeners.forEach((listener) => listener());
  }

  function updateDevice(deviceId: string, type: DeviceType, lastSeen: number) {
    state = {
      ...state,
      devices: {
        ...state.devices,
        [deviceId]: {
          id: deviceId,
          type,
          lastSeen
        }
      }
    };
  }

  return {
    getSnapshot: () => state,
    subscribe: (listener: Listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reset: () => {
      state = initialState;
      emit();
    },
    upsertRelay: (deviceId: string, relay: RelayState) => {
      updateDevice(deviceId, "relay", relay.lastUpdated);
      state = {
        ...state,
        relays: {
          ...state.relays,
          [deviceId]: {
            ...(state.relays[deviceId] ?? {}),
            [relay.id]: relay
          }
        }
      };
      emit();
    },
    upsertSensor: (deviceId: string, sensor: SensorState) => {
      updateDevice(deviceId, "sensor", sensor.lastUpdated);
      state = {
        ...state,
        sensors: {
          ...state.sensors,
          [deviceId]: {
            ...(state.sensors[deviceId] ?? {}),
            [sensor.id]: sensor
          }
        }
      };
      emit();
    },
    upsertWLED: (deviceId: string, wled: Partial<WLEDState> & Pick<WLEDState, "lastUpdated" | "topic">) => {
      updateDevice(deviceId, "wled", wled.lastUpdated);
      state = {
        ...state,
        wled: {
          ...state.wled,
          [deviceId]: {
            ...defaultWLEDState,
            ...(state.wled[deviceId] ?? {}),
            ...wled
          }
        }
      };
      emit();
    }
  };
}

export const appStore = createStore();

export function useAppStore() {
  return useSyncExternalStore(appStore.subscribe, appStore.getSnapshot, appStore.getSnapshot);
}

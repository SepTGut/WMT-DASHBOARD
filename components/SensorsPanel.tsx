import { useAppStore } from "@/state/store";

export function SensorsPanel() {
  const { sensors } = useAppStore();
  const rows = Object.entries(sensors).flatMap(([deviceId, sensorMap]) =>
    Object.values(sensorMap).map((sensor) => ({ deviceId, sensor }))
  );

  return (
    <section className="panel p-4">
      <h2 className="text-lg font-medium mb-3">Sensors</h2>
      {rows.length === 0 ? (
        <p className="text-slate-400 text-sm">No sensor readings received yet.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rows.map(({ deviceId, sensor }) => (
            <div key={`${deviceId}-${sensor.id}`} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
              <div className="text-sm text-slate-400">{deviceId}</div>
              <div className="font-medium">{sensor.id}</div>
              <div className="text-2xl mt-2">
                {sensor.value}
                {sensor.unit ? <span className="text-sm text-slate-400 ml-1">{sensor.unit}</span> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

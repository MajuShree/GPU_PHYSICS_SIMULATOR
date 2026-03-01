import { FrameMetrics } from '@/lib/physics-engine';

interface MetricsDashboardProps {
  metrics: FrameMetrics | null;
  fpsHistory: number[];
}

const MetricCard = ({ label, value, unit, color }: { label: string; value: string; unit?: string; color?: string }) => (
  <div className="p-3 bg-muted rounded-md border border-border">
    <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{label}</div>
    <div className={`text-lg font-mono font-bold ${color || 'text-foreground'}`}>
      {value}
      {unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
    </div>
  </div>
);

const MetricsDashboard = ({ metrics, fpsHistory }: MetricsDashboardProps) => {
  if (!metrics) return null;

  const avgFps = fpsHistory.length > 0
    ? Math.round(fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length)
    : 0;

  const maxBarHeight = 40;
  const maxFps = Math.max(...fpsHistory, 60);
  const recentFps = fpsHistory.slice(-30);

  return (
    <div className="flex flex-col gap-3 p-4 bg-card rounded-lg border border-glow">
      <h2 className="text-sm font-mono font-semibold text-primary tracking-wider uppercase">
        📊 Metrics
      </h2>

      <div className="grid grid-cols-2 gap-2">
        <MetricCard
          label="FPS"
          value={metrics.fps.toFixed(0)}
          color={metrics.fps > 30 ? 'text-secondary' : metrics.fps > 15 ? 'text-warning' : 'text-destructive'}
        />
        <MetricCard label="Step Time" value={metrics.stepTimeMs.toFixed(2)} unit="ms" />
        <MetricCard
          label="Mode"
          value={metrics.mode === 'gpu' ? 'PARALLEL' : 'SEQUENTIAL'}
          color={metrics.mode === 'gpu' ? 'text-gpu' : 'text-cpu'}
        />
        <MetricCard
          label="Throughput"
          value={metrics.throughput > 1e6
            ? `${(metrics.throughput / 1e6).toFixed(1)}M`
            : `${(metrics.throughput / 1e3).toFixed(0)}K`
          }
          unit="p/s"
        />
      </div>

      {/* Mini FPS chart */}
      <div>
        <div className="text-[10px] font-mono text-muted-foreground mb-1">FPS History (avg: {avgFps})</div>
        <div className="flex items-end gap-[1px] h-10 bg-muted rounded p-1">
          {recentFps.map((fps, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm"
              style={{
                height: `${Math.max(1, (fps / maxFps) * maxBarHeight)}px`,
                backgroundColor: fps > 30 ? 'hsl(150, 80%, 45%)' : fps > 15 ? 'hsl(45, 100%, 55%)' : 'hsl(0, 85%, 55%)',
                opacity: 0.5 + (i / recentFps.length) * 0.5,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboard;

import { FrameMetrics } from '@/lib/physics-engine';
import { motion } from 'framer-motion';
import { Activity, Clock, Gauge, Cpu } from 'lucide-react';

interface MetricsDashboardProps {
  metrics: FrameMetrics | null;
  fpsHistory: number[];
}

const MetricCard = ({ icon: Icon, label, value, unit, color }: {
  icon: React.ElementType; label: string; value: string; unit?: string; color?: string;
}) => (
  <div className="p-3 rounded-lg card-glow border flex flex-col gap-1">
    <div className="flex items-center gap-1.5">
      <Icon className={`w-3 h-3 ${color || 'text-muted-foreground'}`} />
      <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-[0.15em]">{label}</span>
    </div>
    <div className={`text-xl font-mono font-bold leading-none ${color || 'text-foreground'}`}>
      {value}
      {unit && <span className="text-[10px] text-muted-foreground ml-1 font-normal">{unit}</span>}
    </div>
  </div>
);

const MetricsDashboard = ({ metrics, fpsHistory }: MetricsDashboardProps) => {
  if (!metrics) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
        <Activity className="w-8 h-8 mb-2 opacity-30" />
        <p className="text-xs font-mono">Press START to begin simulation</p>
      </div>
    );
  }

  const avgFps = fpsHistory.length > 0
    ? Math.round(fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length)
    : 0;
  const maxFps = Math.max(...fpsHistory, 60);
  const recentFps = fpsHistory.slice(-40);

  const fpsColor = metrics.fps > 30 ? 'text-secondary' : metrics.fps > 15 ? 'text-warning' : 'text-destructive';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <MetricCard icon={Gauge} label="FPS" value={metrics.fps.toFixed(0)} color={fpsColor} />
        <MetricCard icon={Clock} label="Step Time" value={metrics.stepTimeMs.toFixed(2)} unit="ms" />
        <MetricCard
          icon={Cpu}
          label="Mode"
          value={metrics.mode === 'gpu' ? 'PAR' : 'SEQ'}
          color={metrics.mode === 'gpu' ? 'text-gpu' : 'text-cpu'}
        />
        <MetricCard
          icon={Activity}
          label="Throughput"
          value={metrics.throughput > 1e6
            ? `${(metrics.throughput / 1e6).toFixed(1)}M`
            : `${(metrics.throughput / 1e3).toFixed(0)}K`}
          unit="p/s"
        />
      </div>

      {/* FPS Sparkline */}
      <div className="p-3 rounded-lg card-glow border">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-[0.15em]">FPS Timeline</span>
          <span className="text-[10px] font-mono text-muted-foreground">avg: {avgFps}</span>
        </div>
        <div className="flex items-end gap-[2px] h-12">
          {recentFps.map((fps, i) => (
            <div
              key={i}
              className="flex-1 rounded-t-sm transition-all duration-75"
              style={{
                height: `${Math.max(2, (fps / maxFps) * 48)}px`,
                backgroundColor: fps > 30 ? 'hsl(155, 75%, 45%)' : fps > 15 ? 'hsl(45, 100%, 55%)' : 'hsl(0, 80%, 55%)',
                opacity: 0.4 + (i / recentFps.length) * 0.6,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default MetricsDashboard;

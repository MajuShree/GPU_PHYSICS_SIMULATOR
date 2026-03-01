import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Zap, Cpu, BarChart3 } from 'lucide-react';

interface ControlsPanelProps {
  particleCount: number;
  setParticleCount: (v: number) => void;
  gravity: number;
  setGravity: (v: number) => void;
  dt: number;
  setDt: (v: number) => void;
  collisions: boolean;
  setCollisions: (v: boolean) => void;
  mode: 'cpu' | 'gpu';
  setMode: (v: 'cpu' | 'gpu') => void;
  running: boolean;
  onToggleRun: () => void;
  onReset: () => void;
  onBenchmark: () => void;
  benchmarking: boolean;
}

const PARTICLE_STEPS = [1000, 2000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];

const ControlsPanel = ({
  particleCount, setParticleCount,
  gravity, setGravity,
  dt, setDt,
  collisions, setCollisions,
  mode, setMode,
  running, onToggleRun, onReset,
  onBenchmark, benchmarking,
}: ControlsPanelProps) => {
  const countIndex = PARTICLE_STEPS.indexOf(particleCount);

  const formatCount = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return n.toString();
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-card rounded-lg border border-glow">
      <h2 className="text-sm font-mono font-semibold text-primary tracking-wider uppercase">
        ⚙ Controls
      </h2>

      {/* Mode Toggle */}
      <div className="flex items-center gap-3 p-3 rounded-md bg-muted">
        <Cpu className={`w-4 h-4 ${mode === 'cpu' ? 'text-cpu' : 'text-muted-foreground'}`} />
        <span className={`text-xs font-mono ${mode === 'cpu' ? 'text-cpu' : 'text-muted-foreground'}`}>CPU</span>
        <Switch
          checked={mode === 'gpu'}
          onCheckedChange={(v) => setMode(v ? 'gpu' : 'cpu')}
        />
        <Zap className={`w-4 h-4 ${mode === 'gpu' ? 'text-gpu' : 'text-muted-foreground'}`} />
        <span className={`text-xs font-mono ${mode === 'gpu' ? 'text-gpu' : 'text-muted-foreground'}`}>Parallel</span>
      </div>

      {/* Particle Count */}
      <div>
        <label className="text-xs font-mono text-muted-foreground mb-2 block">
          Particles: <span className="text-foreground">{formatCount(particleCount)}</span>
        </label>
        <Slider
          value={[countIndex >= 0 ? countIndex : 0]}
          onValueChange={([v]) => setParticleCount(PARTICLE_STEPS[v])}
          min={0}
          max={PARTICLE_STEPS.length - 1}
          step={1}
        />
      </div>

      {/* Gravity */}
      <div>
        <label className="text-xs font-mono text-muted-foreground mb-2 block">
          Gravity: <span className="text-foreground">{gravity}</span>
        </label>
        <Slider
          value={[gravity]}
          onValueChange={([v]) => setGravity(v)}
          min={0}
          max={2000}
          step={50}
        />
      </div>

      {/* Time Step */}
      <div>
        <label className="text-xs font-mono text-muted-foreground mb-2 block">
          Time Step (dt): <span className="text-foreground">{dt.toFixed(4)}</span>
        </label>
        <Slider
          value={[dt * 10000]}
          onValueChange={([v]) => setDt(v / 10000)}
          min={1}
          max={100}
          step={1}
        />
      </div>

      {/* Collisions */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground">Collisions</span>
        <Switch checked={collisions} onCheckedChange={setCollisions} />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          onClick={onToggleRun}
          variant="default"
          size="sm"
          className="flex-1 font-mono text-xs"
        >
          {running ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />}
          {running ? 'Pause' : 'Start'}
        </Button>
        <Button onClick={onReset} variant="outline" size="sm" className="font-mono text-xs">
          <RotateCcw className="w-3 h-3" />
        </Button>
      </div>

      <Button
        onClick={onBenchmark}
        disabled={benchmarking}
        variant="outline"
        size="sm"
        className="font-mono text-xs border-primary/30 text-primary hover:bg-primary/10"
      >
        <BarChart3 className="w-3 h-3 mr-1" />
        {benchmarking ? 'Running Benchmark...' : 'Run Full Benchmark'}
      </Button>
    </div>
  );
};

export default ControlsPanel;

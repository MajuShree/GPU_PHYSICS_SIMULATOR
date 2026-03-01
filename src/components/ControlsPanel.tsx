import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Zap, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

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
}

const PARTICLE_STEPS = [1000, 2000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000];

const formatCount = (n: number) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return n.toString();
};

const ControlsPanel = ({
  particleCount, setParticleCount,
  gravity, setGravity,
  dt, setDt,
  collisions, setCollisions,
  mode, setMode,
  running, onToggleRun, onReset,
}: ControlsPanelProps) => {
  const countIndex = PARTICLE_STEPS.indexOf(particleCount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-5"
    >
      {/* Mode Toggle */}
      <div className="p-4 rounded-xl card-glow border">
        <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.15em] mb-3 block">
          Execution Mode
        </label>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 transition-colors ${mode === 'cpu' ? 'text-cpu' : 'text-muted-foreground'}`}>
            <Cpu className="w-4 h-4" />
            <span className="text-xs font-mono font-medium">Sequential</span>
          </div>
          <Switch
            checked={mode === 'gpu'}
            onCheckedChange={(v) => setMode(v ? 'gpu' : 'cpu')}
          />
          <div className={`flex items-center gap-1.5 transition-colors ${mode === 'gpu' ? 'text-gpu' : 'text-muted-foreground'}`}>
            <Zap className="w-4 h-4" />
            <span className="text-xs font-mono font-medium">Parallel</span>
          </div>
        </div>
      </div>

      {/* Particle Count */}
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.15em]">Particles</label>
          <span className="text-sm font-mono font-bold text-foreground">{formatCount(particleCount)}</span>
        </div>
        <Slider
          value={[countIndex >= 0 ? countIndex : 0]}
          onValueChange={([v]) => setParticleCount(PARTICLE_STEPS[v])}
          min={0} max={PARTICLE_STEPS.length - 1} step={1}
        />
        <div className="flex justify-between text-[9px] font-mono text-muted-foreground">
          <span>1K</span><span>1M</span>
        </div>
      </div>

      {/* Gravity */}
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.15em]">Gravity</label>
          <span className="text-sm font-mono font-bold text-foreground">{gravity}</span>
        </div>
        <Slider value={[gravity]} onValueChange={([v]) => setGravity(v)} min={0} max={2000} step={50} />
      </div>

      {/* Time Step */}
      <div className="space-y-2">
        <div className="flex justify-between items-baseline">
          <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.15em]">Time Step</label>
          <span className="text-sm font-mono font-bold text-foreground">{dt.toFixed(4)}</span>
        </div>
        <Slider value={[dt * 10000]} onValueChange={([v]) => setDt(v / 10000)} min={1} max={100} step={1} />
      </div>

      {/* Collisions */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <span className="text-xs font-mono text-muted-foreground">Elastic Collisions</span>
        <Switch checked={collisions} onCheckedChange={setCollisions} />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-1">
        <Button
          onClick={onToggleRun}
          size="lg"
          className={`flex-1 font-mono text-xs font-semibold tracking-wider ${
            running
              ? 'bg-destructive/20 text-destructive hover:bg-destructive/30 border border-destructive/30'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
          variant={running ? 'outline' : 'default'}
        >
          {running ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          {running ? 'PAUSE' : 'START'}
        </Button>
        <Button onClick={onReset} variant="outline" size="lg" className="font-mono px-4">
          <RotateCcw className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default ControlsPanel;

import { useState, useCallback, useRef, useEffect } from 'react';
import ParticleCanvas from '@/components/ParticleCanvas';
import ControlsPanel from '@/components/ControlsPanel';
import MetricsDashboard from '@/components/MetricsDashboard';
import BenchmarkChart from '@/components/BenchmarkChart';
import ArchitecturePanel from '@/components/ArchitecturePanel';
import {
  SimulationState,
  SimulationConfig,
  FrameMetrics,
  BenchmarkResult,
  createSimulationState,
  stepCPU,
  stepGPU,
  runBenchmark,
} from '@/lib/physics-engine';
import { Activity } from 'lucide-react';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

const Index = () => {
  const [particleCount, setParticleCount] = useState(10000);
  const [gravity, setGravity] = useState(500);
  const [dt, setDt] = useState(0.016);
  const [collisions, setCollisions] = useState(false);
  const [mode, setMode] = useState<'cpu' | 'gpu'>('gpu');
  const [running, setRunning] = useState(false);
  const [metrics, setMetrics] = useState<FrameMetrics | null>(null);
  const [fpsHistory, setFpsHistory] = useState<number[]>([]);
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([]);
  const [benchmarkProgress, setBenchmarkProgress] = useState(0);
  const [benchmarking, setBenchmarking] = useState(false);

  const stateRef = useRef<SimulationState | null>(null);
  const runningRef = useRef(false);
  const lastFrameRef = useRef(0);
  const animRef = useRef<number>(0);

  const configRef = useRef<SimulationConfig>({
    particleCount, gravity, dt, damping: 0.8, collisions,
    width: CANVAS_WIDTH, height: CANVAS_HEIGHT,
  });
  const modeRef = useRef(mode);

  useEffect(() => {
    configRef.current = { particleCount, gravity, dt, damping: 0.8, collisions, width: CANVAS_WIDTH, height: CANVAS_HEIGHT };
  }, [particleCount, gravity, dt, collisions]);

  useEffect(() => { modeRef.current = mode; }, [mode]);

  const initState = useCallback(() => {
    stateRef.current = createSimulationState(configRef.current);
  }, []);

  useEffect(() => { initState(); }, [particleCount, initState]);

  const loop = useCallback(() => {
    if (!runningRef.current || !stateRef.current) return;

    const now = performance.now();
    const stepFn = modeRef.current === 'gpu' ? stepGPU : stepCPU;
    const stepTime = stepFn(stateRef.current, configRef.current);
    const frameDelta = now - lastFrameRef.current;
    const fps = frameDelta > 0 ? 1000 / frameDelta : 0;
    lastFrameRef.current = now;

    const m: FrameMetrics = {
      stepTimeMs: stepTime,
      fps,
      particleCount: stateRef.current.count,
      mode: modeRef.current,
      throughput: stateRef.current.count * fps,
    };
    setMetrics(m);
    setFpsHistory(prev => [...prev.slice(-59), fps]);

    animRef.current = requestAnimationFrame(loop);
  }, []);

  const toggleRun = useCallback(() => {
    if (running) {
      runningRef.current = false;
      cancelAnimationFrame(animRef.current);
      setRunning(false);
    } else {
      if (!stateRef.current) initState();
      runningRef.current = true;
      lastFrameRef.current = performance.now();
      setRunning(true);
      animRef.current = requestAnimationFrame(loop);
    }
  }, [running, loop, initState]);

  const reset = useCallback(() => {
    runningRef.current = false;
    cancelAnimationFrame(animRef.current);
    setRunning(false);
    setMetrics(null);
    setFpsHistory([]);
    initState();
  }, [initState]);

  const handleBenchmark = useCallback(async () => {
    runningRef.current = false;
    cancelAnimationFrame(animRef.current);
    setRunning(false);
    setBenchmarking(true);
    setBenchmarkProgress(0);
    setBenchmarkResults([]);

    const counts = [1000, 5000, 10000, 50000, 100000, 500000];
    const results = await runBenchmark(counts, {
      gravity, dt, damping: 0.8, collisions: false,
      width: CANVAS_WIDTH, height: CANVAS_HEIGHT,
    }, setBenchmarkProgress);

    setBenchmarkResults(results);
    setBenchmarking(false);
  }, [gravity, dt]);

  return (
    <div className="min-h-screen bg-background scanline">
      {/* Header */}
      <header className="border-b border-border p-4">
        <div className="max-w-[1400px] mx-auto flex items-center gap-3">
          <Activity className="w-5 h-5 text-primary animate-pulse-glow" />
          <h1 className="text-lg font-mono font-bold text-foreground text-glow tracking-wide">
            GPU Physics Simulator
          </h1>
          <span className="text-[10px] font-mono text-muted-foreground px-2 py-0.5 bg-muted rounded">
            v1.0 • WebCompute
          </span>
          <div className="ml-auto flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${running ? 'bg-secondary animate-pulse' : 'bg-muted-foreground'}`} />
            <span className="text-xs font-mono text-muted-foreground">
              {running ? 'SIMULATING' : 'IDLE'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="max-w-[1400px] mx-auto p-4 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* Left: Canvas + Benchmark */}
        <div className="flex flex-col gap-4">
          <div className="relative" style={{ aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}>
            <ParticleCanvas
              state={stateRef.current}
              mode={mode}
              running={running}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
            />
            {/* FPS Overlay */}
            {metrics && running && (
              <div className="absolute top-3 left-3 bg-background/80 backdrop-blur px-2 py-1 rounded text-xs font-mono">
                <span className={metrics.fps > 30 ? 'text-secondary' : 'text-destructive'}>
                  {metrics.fps.toFixed(0)} FPS
                </span>
                <span className="text-muted-foreground ml-2">{metrics.stepTimeMs.toFixed(2)}ms</span>
                <span className={`ml-2 ${mode === 'gpu' ? 'text-gpu' : 'text-cpu'}`}>
                  {mode === 'gpu' ? '⚡ PARALLEL' : '🔄 SEQUENTIAL'}
                </span>
              </div>
            )}
          </div>

          <BenchmarkChart results={benchmarkResults} progress={benchmarkProgress} />
          <ArchitecturePanel />
        </div>

        {/* Right: Controls + Metrics */}
        <div className="flex flex-col gap-4">
          <ControlsPanel
            particleCount={particleCount}
            setParticleCount={setParticleCount}
            gravity={gravity}
            setGravity={setGravity}
            dt={dt}
            setDt={setDt}
            collisions={collisions}
            setCollisions={setCollisions}
            mode={mode}
            setMode={setMode}
            running={running}
            onToggleRun={toggleRun}
            onReset={reset}
            onBenchmark={handleBenchmark}
            benchmarking={benchmarking}
          />
          <MetricsDashboard metrics={metrics} fpsHistory={fpsHistory} />
        </div>
      </div>
    </div>
  );
};

export default Index;

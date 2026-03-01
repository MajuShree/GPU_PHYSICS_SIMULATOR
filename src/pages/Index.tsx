import { useState, useCallback, useRef, useEffect } from 'react';
import ParticleCanvas from '@/components/ParticleCanvas';
import ControlsPanel from '@/components/ControlsPanel';
import MetricsDashboard from '@/components/MetricsDashboard';
import BenchmarkView from '@/components/BenchmarkView';
import ArchitectureView from '@/components/ArchitectureView';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import { Activity, BarChart3, BookOpen, Atom } from 'lucide-react';

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 520;

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

    setMetrics({
      stepTimeMs: stepTime,
      fps,
      particleCount: stateRef.current.count,
      mode: modeRef.current,
      throughput: stateRef.current.count * fps,
    });
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
      <header className="border-b border-border/60 px-6 py-3">
        <div className="max-w-[1440px] mx-auto flex items-center gap-3">
          <Atom className="w-5 h-5 text-primary" />
          <h1 className="text-base font-bold text-foreground tracking-wide">
            <span className="text-primary text-glow">GPU</span> Physics Simulator
          </h1>
          <span className="text-[9px] font-mono text-muted-foreground px-2 py-0.5 bg-muted rounded-full ml-1">
            WebCompute v2.0
          </span>
          <div className="ml-auto flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full status-dot transition-colors ${running ? 'bg-secondary' : 'bg-muted-foreground/40'}`} />
            <span className="text-[10px] font-mono text-muted-foreground tracking-wider">
              {running ? 'ACTIVE' : 'STANDBY'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto p-4">
        <Tabs defaultValue="simulator" className="w-full">
          <TabsList className="bg-muted/50 border border-border p-1 mb-4">
            <TabsTrigger value="simulator" className="font-mono text-xs data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-none gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Simulator
            </TabsTrigger>
            <TabsTrigger value="benchmark" className="font-mono text-xs data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-none gap-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              Benchmark
            </TabsTrigger>
            <TabsTrigger value="architecture" className="font-mono text-xs data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-none gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Architecture
            </TabsTrigger>
          </TabsList>

          {/* SIMULATOR TAB */}
          <TabsContent value="simulator">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4">
              {/* Canvas Area */}
              <div className="space-y-3">
                <div className="relative">
                  <ParticleCanvas
                    state={stateRef.current}
                    mode={mode}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                  />
                  {/* FPS Overlay */}
                  {metrics && running && (
                    <div className="absolute top-3 left-3 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border/50 flex items-center gap-3">
                      <span className={`text-xs font-mono font-bold ${metrics.fps > 30 ? 'text-secondary' : metrics.fps > 15 ? 'text-warning' : 'text-destructive'}`}>
                        {metrics.fps.toFixed(0)} FPS
                      </span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {metrics.stepTimeMs.toFixed(2)}ms
                      </span>
                      <span className={`text-[10px] font-mono font-semibold ${mode === 'gpu' ? 'text-gpu' : 'text-cpu'}`}>
                        {mode === 'gpu' ? '⚡ PARALLEL' : '🔄 SEQ'}
                      </span>
                    </div>
                  )}
                  {/* Particle count badge */}
                  <div className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border/50">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {particleCount.toLocaleString()} particles
                    </span>
                  </div>
                </div>
              </div>

              {/* Controls + Metrics Sidebar */}
              <div className="space-y-4">
                <ControlsPanel
                  particleCount={particleCount} setParticleCount={setParticleCount}
                  gravity={gravity} setGravity={setGravity}
                  dt={dt} setDt={setDt}
                  collisions={collisions} setCollisions={setCollisions}
                  mode={mode} setMode={setMode}
                  running={running} onToggleRun={toggleRun} onReset={reset}
                />
                <div className="border-t border-border/30 pt-4">
                  <h3 className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.15em] mb-3">
                    Live Metrics
                  </h3>
                  <MetricsDashboard metrics={metrics} fpsHistory={fpsHistory} />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* BENCHMARK TAB */}
          <TabsContent value="benchmark">
            <div className="max-w-4xl mx-auto">
              <BenchmarkView
                results={benchmarkResults}
                progress={benchmarkProgress}
                benchmarking={benchmarking}
                onBenchmark={handleBenchmark}
              />
            </div>
          </TabsContent>

          {/* ARCHITECTURE TAB */}
          <TabsContent value="architecture">
            <div className="max-w-3xl mx-auto">
              <ArchitectureView />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;

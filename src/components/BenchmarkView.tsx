import { BenchmarkResult } from '@/lib/physics-engine';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

interface BenchmarkViewProps {
  results: BenchmarkResult[];
  progress: number;
  benchmarking: boolean;
  onBenchmark: () => void;
}

const BenchmarkView = ({ results, progress, benchmarking, onBenchmark }: BenchmarkViewProps) => {
  const chartData = results.map(r => ({
    particles: r.particleCount >= 1e6 ? `${(r.particleCount / 1e6).toFixed(1)}M`
      : r.particleCount >= 1000 ? `${r.particleCount / 1000}K`
      : r.particleCount.toString(),
    Sequential: r.cpuTimeMs,
    Parallel: r.gpuTimeMs,
    Speedup: r.speedup,
  }));

  const avgSpeedup = results.length > 0
    ? (results.reduce((a, b) => a + b.speedup, 0) / results.length).toFixed(2)
    : '0';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Run Benchmark CTA */}
      <div className="flex items-center justify-between p-5 rounded-xl card-glow border">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-1">Automated Benchmark Suite</h3>
          <p className="text-xs text-muted-foreground font-mono">
            Tests 1K → 500K particles across both engines
          </p>
        </div>
        <button
          onClick={onBenchmark}
          disabled={benchmarking}
          className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-mono text-xs font-semibold tracking-wider hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {benchmarking ? 'RUNNING...' : 'RUN BENCHMARK'}
        </button>
      </div>

      {/* Progress Bar */}
      {benchmarking && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <motion.div
              className="bg-primary h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {results.length > 0 && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-xl card-glow border text-center">
              <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-[0.15em] mb-1">Avg Speedup</div>
              <div className="text-2xl font-mono font-bold text-secondary flex items-center justify-center gap-1">
                <TrendingUp className="w-5 h-5" />
                {avgSpeedup}x
              </div>
            </div>
            <div className="p-4 rounded-xl card-glow border text-center">
              <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-[0.15em] mb-1">Peak Speedup</div>
              <div className="text-2xl font-mono font-bold text-primary">
                {Math.max(...results.map(r => r.speedup)).toFixed(2)}x
              </div>
            </div>
            <div className="p-4 rounded-xl card-glow border text-center">
              <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-[0.15em] mb-1">Test Cases</div>
              <div className="text-2xl font-mono font-bold text-foreground">{results.length}</div>
            </div>
          </div>

          {/* Line Chart - Execution Time */}
          <div className="p-4 rounded-xl card-glow border">
            <h4 className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.15em] mb-3">
              Execution Time Comparison
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 14%)" />
                  <XAxis dataKey="particles" tick={{ fontSize: 10, fill: 'hsl(215, 15%, 50%)', fontFamily: 'JetBrains Mono' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 15%, 50%)', fontFamily: 'JetBrains Mono' }}
                    label={{ value: 'Time (ms)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: 'hsl(215, 15%, 50%)', fontFamily: 'JetBrains Mono' } }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(225, 30%, 9%)', border: '1px solid hsl(185, 100%, 50%, 0.2)', borderRadius: 8, fontSize: 11, fontFamily: 'JetBrains Mono' }}
                    labelStyle={{ color: 'hsl(195, 50%, 88%)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                  <Line type="monotone" dataKey="Sequential" stroke="hsl(30, 95%, 55%)" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(30, 95%, 55%)' }} />
                  <Line type="monotone" dataKey="Parallel" stroke="hsl(185, 100%, 50%)" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(185, 100%, 50%)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Speedup Bar Chart */}
          <div className="p-4 rounded-xl card-glow border">
            <h4 className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.15em] mb-3">
              Parallel Speedup Factor
            </h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 20%, 14%)" />
                  <XAxis dataKey="particles" tick={{ fontSize: 10, fill: 'hsl(215, 15%, 50%)', fontFamily: 'JetBrains Mono' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(215, 15%, 50%)', fontFamily: 'JetBrains Mono' }}
                    label={{ value: 'Speedup (x)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: 'hsl(215, 15%, 50%)', fontFamily: 'JetBrains Mono' } }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(225, 30%, 9%)', border: '1px solid hsl(185, 100%, 50%, 0.2)', borderRadius: 8, fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  />
                  <Bar dataKey="Speedup" fill="hsl(155, 75%, 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Data Table */}
          <div className="p-4 rounded-xl card-glow border overflow-x-auto">
            <h4 className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.15em] mb-3">
              Raw Results
            </h4>
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left py-2 px-3">Particles</th>
                  <th className="text-right py-2 px-3">Sequential (ms)</th>
                  <th className="text-right py-2 px-3">Parallel (ms)</th>
                  <th className="text-right py-2 px-3">Speedup</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="py-2 px-3 text-foreground font-medium">{chartData[i].particles}</td>
                    <td className="py-2 px-3 text-right text-cpu">{r.cpuTimeMs.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right text-gpu">{r.gpuTimeMs.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right text-secondary font-bold">{r.speedup.toFixed(2)}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {results.length === 0 && !benchmarking && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <TrendingUp className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm font-mono">Run a benchmark to see results</p>
          <p className="text-xs font-mono mt-1 opacity-60">Compares sequential vs parallel execution across particle counts</p>
        </div>
      )}
    </motion.div>
  );
};

export default BenchmarkView;

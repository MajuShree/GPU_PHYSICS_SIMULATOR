import { BenchmarkResult } from '@/lib/physics-engine';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface BenchmarkChartProps {
  results: BenchmarkResult[];
  progress: number;
}

const BenchmarkChart = ({ results, progress }: BenchmarkChartProps) => {
  if (results.length === 0 && progress === 0) return null;

  const chartData = results.map(r => ({
    particles: r.particleCount >= 1000000 ? `${(r.particleCount / 1000000).toFixed(1)}M`
      : r.particleCount >= 1000 ? `${r.particleCount / 1000}K`
      : r.particleCount.toString(),
    CPU: r.cpuTimeMs,
    Parallel: r.gpuTimeMs,
    Speedup: r.speedup,
  }));

  return (
    <div className="flex flex-col gap-4 p-4 bg-card rounded-lg border border-glow">
      <h2 className="text-sm font-mono font-semibold text-primary tracking-wider uppercase">
        🏁 Benchmark Results
      </h2>

      {progress > 0 && progress < 1 && (
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      {results.length > 0 && (
        <>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 30%, 18%)" />
                <XAxis dataKey="particles" tick={{ fontSize: 10, fill: 'hsl(210, 20%, 55%)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(210, 20%, 55%)' }} label={{ value: 'ms', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: 'hsl(210, 20%, 55%)' } }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(222, 47%, 9%)', border: '1px solid hsl(185, 100%, 50%, 0.3)', fontSize: 11 }}
                  labelStyle={{ color: 'hsl(190, 100%, 90%)' }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="CPU" stroke="hsl(35, 100%, 55%)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Parallel" stroke="hsl(185, 100%, 50%)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left p-1">Particles</th>
                  <th className="text-right p-1">CPU (ms)</th>
                  <th className="text-right p-1">Parallel (ms)</th>
                  <th className="text-right p-1">Speedup</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="p-1 text-foreground">{chartData[i].particles}</td>
                    <td className="p-1 text-right text-cpu">{r.cpuTimeMs.toFixed(2)}</td>
                    <td className="p-1 text-right text-gpu">{r.gpuTimeMs.toFixed(2)}</td>
                    <td className="p-1 text-right text-secondary font-bold">{r.speedup.toFixed(2)}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default BenchmarkChart;

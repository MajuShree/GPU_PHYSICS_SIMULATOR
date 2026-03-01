const ArchitecturePanel = () => (
  <div className="p-4 bg-card rounded-lg border border-glow">
    <h2 className="text-sm font-mono font-semibold text-primary tracking-wider uppercase mb-3">
      🧠 Architecture
    </h2>
    <div className="space-y-3 text-xs font-mono text-muted-foreground leading-relaxed">
      <div>
        <h3 className="text-foreground font-semibold mb-1">Thread-Level Parallelism</h3>
        <p>
          In true GPU computing, each particle maps to a GPU thread. Thousands of threads execute
          simultaneously via SIMD (Single Instruction, Multiple Data) units. This demo simulates
          that via vectorized batch operations on Float32Arrays.
        </p>
      </div>
      <div>
        <h3 className="text-foreground font-semibold mb-1">Why CPU Degrades</h3>
        <p>
          Sequential mode processes particles one-by-one with individual property accesses
          and branch predictions. As count grows, cache misses and branch mispredictions
          cause nonlinear slowdown.
        </p>
      </div>
      <div>
        <h3 className="text-foreground font-semibold mb-1">Parallel Scalability</h3>
        <p>
          Vectorized operations leverage CPU SIMD extensions (SSE/AVX) and V8's optimized
          TypedArray paths. Operations on contiguous memory are batched, reducing overhead
          per particle and scaling more linearly.
        </p>
      </div>
    </div>
  </div>
);

export default ArchitecturePanel;

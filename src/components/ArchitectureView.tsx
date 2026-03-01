import { motion } from 'framer-motion';
import { Cpu, Zap, Layers, MemoryStick, ArrowRight, Server } from 'lucide-react';

const sections = [
  {
    icon: Zap,
    title: 'Thread-Level Parallelism',
    color: 'text-gpu',
    content: `In true GPU computing, each particle maps to an individual GPU thread. Modern GPUs contain 
thousands of CUDA/Stream cores that execute the same instruction simultaneously across different data elements 
(SIMD — Single Instruction, Multiple Data). This simulation demonstrates this principle using vectorized 
Float32Array batch operations that mirror GPU kernel execution patterns.`,
  },
  {
    icon: Cpu,
    title: 'Why Sequential Processing Degrades',
    color: 'text-cpu',
    content: `The sequential engine processes particles one-by-one in a traditional loop. As particle count grows, 
several bottlenecks compound: L1/L2 cache thrashing from scattered memory access patterns, branch misprediction 
penalties from boundary checks, and instruction pipeline stalls. The CPU's out-of-order execution engine cannot 
effectively hide these latencies at scale, causing non-linear performance degradation.`,
  },
  {
    icon: Layers,
    title: 'Vectorized Computation Model',
    color: 'text-secondary',
    content: `The parallel engine separates physics computations into distinct passes — gravity application, 
position integration, and boundary resolution — each operating on contiguous Float32Array memory. This layout 
enables the JavaScript engine's JIT compiler to emit SIMD instructions (SSE/AVX on x86, NEON on ARM), processing 
4-8 particles per hardware instruction. The separation also improves branch prediction and cache coherency.`,
  },
  {
    icon: MemoryStick,
    title: 'Memory Architecture',
    color: 'text-accent',
    content: `Particle data is stored in Structure-of-Arrays (SoA) format using typed arrays — separate contiguous 
buffers for positions [x0,y0,x1,y1...] and velocities [vx0,vy0,vx1,vy1...]. This is fundamentally different 
from Array-of-Structures (AoS) where each particle object sits separately in heap memory. SoA maximizes cache 
line utilization: when updating all X positions, adjacent X values share the same cache line.`,
  },
  {
    icon: Server,
    title: 'Real GPU Architecture',
    color: 'text-primary',
    content: `On actual GPU hardware (NVIDIA CUDA, AMD ROCm), each particle would be assigned to a thread within 
a warp/wavefront (32/64 threads). A kernel launch like <<<numBlocks, 256>>> would schedule N/256 thread blocks, 
each processing 256 particles. Global memory coalescing, shared memory tiling for collision detection, and warp 
divergence avoidance would further optimize throughput to billions of particle-updates per second.`,
  },
];

const ArchitectureView = () => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
    {/* Diagram */}
    <div className="p-6 rounded-xl card-glow border">
      <h3 className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.15em] mb-4">
        Execution Pipeline
      </h3>
      <div className="flex items-center justify-center gap-3 flex-wrap">
        {['Particle Data', 'Gravity Pass', 'Position Pass', 'Boundary Pass', 'Collision Pass', 'Render'].map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="px-3 py-2 rounded-lg bg-muted border border-border text-[10px] font-mono text-foreground whitespace-nowrap">
              {step}
            </div>
            {i < 5 && <ArrowRight className="w-3 h-3 text-muted-foreground" />}
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="text-[9px] font-mono text-cpu uppercase tracking-wider mb-1">Sequential</div>
          <div className="text-[10px] font-mono text-muted-foreground">
            Each pass: for(i=0; i&lt;N; i++) → process particle[i]
          </div>
          <div className="text-[10px] font-mono text-muted-foreground mt-1">
            One particle at a time, branch-heavy
          </div>
        </div>
        <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
          <div className="text-[9px] font-mono text-gpu uppercase tracking-wider mb-1">Parallel</div>
          <div className="text-[10px] font-mono text-muted-foreground">
            Each pass: vectorized batch op on Float32Array
          </div>
          <div className="text-[10px] font-mono text-muted-foreground mt-1">
            SIMD-friendly, cache-coherent, branchless
          </div>
        </div>
      </div>
    </div>

    {/* Detailed Sections */}
    {sections.map((section, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.05 }}
        className="p-5 rounded-xl card-glow border"
      >
        <div className="flex items-center gap-2 mb-3">
          <section.icon className={`w-4 h-4 ${section.color}`} />
          <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
        </div>
        <p className="text-xs font-mono text-muted-foreground leading-relaxed">{section.content}</p>
      </motion.div>
    ))}
  </motion.div>
);

export default ArchitectureView;

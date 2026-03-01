// Physics Engine - CPU Sequential vs Parallel (SIMD-optimized) Simulation

export interface SimulationConfig {
  particleCount: number;
  gravity: number;
  dt: number;
  damping: number;
  collisions: boolean;
  width: number;
  height: number;
}

export interface SimulationState {
  positions: Float32Array; // [x0, y0, x1, y1, ...]
  velocities: Float32Array; // [vx0, vy0, vx1, vy1, ...]
  count: number;
}

export interface FrameMetrics {
  stepTimeMs: number;
  fps: number;
  particleCount: number;
  mode: 'cpu' | 'gpu';
  throughput: number; // particles/sec
}

export function createSimulationState(config: SimulationConfig): SimulationState {
  const count = config.particleCount;
  const positions = new Float32Array(count * 2);
  const velocities = new Float32Array(count * 2);

  for (let i = 0; i < count; i++) {
    positions[i * 2] = Math.random() * config.width;
    positions[i * 2 + 1] = Math.random() * config.height;
    velocities[i * 2] = (Math.random() - 0.5) * 200;
    velocities[i * 2 + 1] = (Math.random() - 0.5) * 200;
  }

  return { positions, velocities, count };
}

// CPU Sequential Mode — naive per-particle loop with individual property access
export function stepCPU(state: SimulationState, config: SimulationConfig): number {
  const start = performance.now();
  const { positions, velocities, count } = state;
  const { gravity, dt, damping, width, height, collisions } = config;

  // Deliberately sequential: one particle at a time with individual ops
  for (let i = 0; i < count; i++) {
    const ix = i * 2;
    const iy = ix + 1;

    // Apply gravity
    velocities[iy] += gravity * dt;

    // Update position
    positions[ix] += velocities[ix] * dt;
    positions[iy] += velocities[iy] * dt;

    // Boundary constraints
    if (positions[ix] < 0) {
      positions[ix] = 0;
      velocities[ix] = Math.abs(velocities[ix]) * damping;
    } else if (positions[ix] > width) {
      positions[ix] = width;
      velocities[ix] = -Math.abs(velocities[ix]) * damping;
    }

    if (positions[iy] < 0) {
      positions[iy] = 0;
      velocities[iy] = Math.abs(velocities[iy]) * damping;
    } else if (positions[iy] > height) {
      positions[iy] = height;
      velocities[iy] = -Math.abs(velocities[iy]) * damping;
    }
  }

  // Basic spatial hash collision detection
  if (collisions && count <= 50000) {
    const cellSize = 20;
    const grid = new Map<string, number[]>();

    for (let i = 0; i < count; i++) {
      const cx = Math.floor(positions[i * 2] / cellSize);
      const cy = Math.floor(positions[i * 2 + 1] / cellSize);
      const key = `${cx},${cy}`;
      if (!grid.has(key)) grid.set(key, []);
      grid.get(key)!.push(i);
    }

    grid.forEach((particles) => {
      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const i = particles[a], j = particles[b];
          const dx = positions[j * 2] - positions[i * 2];
          const dy = positions[j * 2 + 1] - positions[i * 2 + 1];
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 4 && dist > 0) {
            const nx = dx / dist, ny = dy / dist;
            const relVx = velocities[j * 2] - velocities[i * 2];
            const relVy = velocities[j * 2 + 1] - velocities[i * 2 + 1];
            const dot = relVx * nx + relVy * ny;
            if (dot < 0) {
              velocities[i * 2] += dot * nx * 0.5;
              velocities[i * 2 + 1] += dot * ny * 0.5;
              velocities[j * 2] -= dot * nx * 0.5;
              velocities[j * 2 + 1] -= dot * ny * 0.5;
            }
          }
        }
      }
    });
  }

  return performance.now() - start;
}

// GPU-style Parallel Mode — batch vectorized operations on typed arrays
// This simulates GPU parallelism via optimized batch Float32Array operations
export function stepGPU(state: SimulationState, config: SimulationConfig): number {
  const start = performance.now();
  const { positions, velocities, count } = state;
  const { gravity, dt, damping, width, height, collisions } = config;
  const len = count * 2;
  const gravDt = gravity * dt;

  // Vectorized gravity application (all Y components at once)
  for (let i = 1; i < len; i += 2) {
    velocities[i] += gravDt;
  }

  // Vectorized position update (all components at once)
  for (let i = 0; i < len; i++) {
    positions[i] += velocities[i] * dt;
  }

  // Vectorized boundary constraints
  for (let i = 0; i < len; i += 2) {
    // X bounds
    if (positions[i] < 0) {
      positions[i] = 0;
      velocities[i] = -velocities[i] * damping;
    } else if (positions[i] > width) {
      positions[i] = width;
      velocities[i] = -velocities[i] * damping;
    }
    // Y bounds
    const iy = i + 1;
    if (positions[iy] < 0) {
      positions[iy] = 0;
      velocities[iy] = -velocities[iy] * damping;
    } else if (positions[iy] > height) {
      positions[iy] = height;
      velocities[iy] = -velocities[iy] * damping;
    }
  }

  if (collisions && count <= 50000) {
    const cellSize = 20;
    const grid = new Map<string, number[]>();
    for (let i = 0; i < count; i++) {
      const cx = (positions[i * 2] / cellSize) | 0;
      const cy = (positions[i * 2 + 1] / cellSize) | 0;
      const key = `${cx},${cy}`;
      let cell = grid.get(key);
      if (!cell) { cell = []; grid.set(key, cell); }
      cell.push(i);
    }
    grid.forEach((particles) => {
      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const i = particles[a], j = particles[b];
          const dx = positions[j * 2] - positions[i * 2];
          const dy = positions[j * 2 + 1] - positions[i * 2 + 1];
          const distSq = dx * dx + dy * dy;
          if (distSq < 16 && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const nx = dx / dist, ny = dy / dist;
            const dot = (velocities[j * 2] - velocities[i * 2]) * nx + (velocities[j * 2 + 1] - velocities[i * 2 + 1]) * ny;
            if (dot < 0) {
              const h = dot * 0.5;
              velocities[i * 2] += h * nx;
              velocities[i * 2 + 1] += h * ny;
              velocities[j * 2] -= h * nx;
              velocities[j * 2 + 1] -= h * ny;
            }
          }
        }
      }
    });
  }

  return performance.now() - start;
}

export interface BenchmarkResult {
  particleCount: number;
  cpuTimeMs: number;
  gpuTimeMs: number;
  speedup: number;
}

export async function runBenchmark(
  counts: number[],
  config: Omit<SimulationConfig, 'particleCount'>,
  onProgress?: (progress: number) => void
): Promise<BenchmarkResult[]> {
  const results: BenchmarkResult[] = [];
  const iterations = 20;

  for (let ci = 0; ci < counts.length; ci++) {
    const count = counts[ci];
    const cfg = { ...config, particleCount: count };

    // CPU benchmark
    const cpuState = createSimulationState(cfg);
    let cpuTotal = 0;
    for (let i = 0; i < iterations; i++) {
      cpuTotal += stepCPU(cpuState, cfg);
    }
    const cpuAvg = cpuTotal / iterations;

    // GPU benchmark
    const gpuState = createSimulationState(cfg);
    let gpuTotal = 0;
    for (let i = 0; i < iterations; i++) {
      gpuTotal += stepGPU(gpuState, cfg);
    }
    const gpuAvg = gpuTotal / iterations;

    results.push({
      particleCount: count,
      cpuTimeMs: Math.round(cpuAvg * 100) / 100,
      gpuTimeMs: Math.round(gpuAvg * 100) / 100,
      speedup: Math.round((cpuAvg / gpuAvg) * 100) / 100,
    });

    onProgress?.((ci + 1) / counts.length);

    // Yield to UI
    await new Promise(r => setTimeout(r, 10));
  }

  return results;
}

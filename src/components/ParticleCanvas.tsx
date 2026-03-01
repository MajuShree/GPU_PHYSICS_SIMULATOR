import { useRef, useEffect, useCallback } from 'react';
import { SimulationState } from '@/lib/physics-engine';

interface ParticleCanvasProps {
  state: SimulationState | null;
  mode: 'cpu' | 'gpu';
  width: number;
  height: number;
}

const ParticleCanvas = ({ state, mode, width, height }: ParticleCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !state) return;
    const ctx = canvas.getContext('2d', { alpha: false })!;

    // Background
    ctx.fillStyle = '#080c14';
    ctx.fillRect(0, 0, width, height);

    // Subtle grid
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.025)';
    ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    const { positions, count } = state;
    const isCpu = mode === 'cpu';
    const maxDraw = 120000;
    const step = count > maxDraw ? Math.ceil(count / maxDraw) : 1;

    if (count > 3000) {
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const r = isCpu ? 255 : 0;
      const g = isCpu ? 150 : 210;
      const b = isCpu ? 30 : 255;
      const r2 = isCpu ? 200 : 0;
      const g2 = isCpu ? 100 : 160;
      const b2 = isCpu ? 20 : 200;

      for (let i = 0; i < count; i += step) {
        const px = positions[i * 2] | 0;
        const py = positions[i * 2 + 1] | 0;
        if (px >= 1 && px < width - 1 && py >= 1 && py < height - 1) {
          const idx = (py * width + px) * 4;
          data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = 255;
          // Glow effect - neighbors
          const offsets = [-4, 4, -width * 4, width * 4];
          for (const o of offsets) {
            const ni = idx + o;
            if (ni >= 0 && ni < data.length - 3) {
              data[ni] = Math.min(255, data[ni] + r2);
              data[ni + 1] = Math.min(255, data[ni + 1] + g2);
              data[ni + 2] = Math.min(255, data[ni + 2] + b2);
              data[ni + 3] = 255;
            }
          }
        }
      }
      ctx.putImageData(imageData, 0, 0);
    } else {
      const color = isCpu ? 'hsl(30, 95%, 55%)' : 'hsl(185, 100%, 50%)';
      const glow = isCpu ? 'rgba(255, 150, 30, 0.4)' : 'rgba(0, 210, 255, 0.4)';
      ctx.fillStyle = color;
      ctx.shadowColor = glow;
      ctx.shadowBlur = 6;
      for (let i = 0; i < count; i++) {
        ctx.beginPath();
        ctx.arc(positions[i * 2], positions[i * 2 + 1], 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    }

    animRef.current = requestAnimationFrame(draw);
  }, [state, mode, width, height]);

  useEffect(() => {
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-lg border border-glow w-full"
      style={{ aspectRatio: `${width}/${height}` }}
    />
  );
};

export default ParticleCanvas;

import { useRef, useEffect } from 'react';
import { SimulationState } from '@/lib/physics-engine';

interface ParticleCanvasProps {
  state: SimulationState | null;
  mode: 'cpu' | 'gpu';
  running: boolean;
  width: number;
  height: number;
}

const ParticleCanvas = ({ state, mode, width, height }: ParticleCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !state) return;
    const ctx = canvas.getContext('2d', { alpha: false })!;

    const draw = () => {
      ctx.fillStyle = '#0a0f1a';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = 'rgba(0, 200, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const { positions, count } = state;
      const isCpu = mode === 'cpu';
      const maxDraw = Math.min(count, 100000);
      const step = count > maxDraw ? Math.ceil(count / maxDraw) : 1;
      const size = count > 50000 ? 1 : count > 10000 ? 1.5 : 2;

      if (count > 5000) {
        // Batch draw using ImageData for large counts
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const r = isCpu ? 255 : 0;
        const g = isCpu ? 165 : 230;
        const b = isCpu ? 0 : 255;

        for (let i = 0; i < count; i += step) {
          const px = positions[i * 2] | 0;
          const py = positions[i * 2 + 1] | 0;
          if (px >= 0 && px < width && py >= 0 && py < height) {
            const idx = (py * width + px) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 255;
            // Sub-pixel glow
            if (px + 1 < width) {
              const idx2 = idx + 4;
              data[idx2] = Math.min(255, data[idx2] + (r >> 1));
              data[idx2 + 1] = Math.min(255, data[idx2 + 1] + (g >> 1));
              data[idx2 + 2] = Math.min(255, data[idx2 + 2] + (b >> 1));
              data[idx2 + 3] = 255;
            }
          }
        }
        ctx.putImageData(imageData, 0, 0);
      } else {
        ctx.fillStyle = isCpu ? 'hsl(35, 100%, 55%)' : 'hsl(185, 100%, 50%)';
        ctx.shadowColor = isCpu ? 'hsl(35, 100%, 55%)' : 'hsl(185, 100%, 50%)';
        ctx.shadowBlur = 4;
        for (let i = 0; i < count; i++) {
          const px = positions[i * 2];
          const py = positions[i * 2 + 1];
          ctx.beginPath();
          ctx.arc(px, py, size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [state, mode, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded-lg border border-glow w-full h-full"
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

export default ParticleCanvas;

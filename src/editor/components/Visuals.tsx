import { useCallback, useEffect, useRef, useState } from "react";
import { H, IW, PAD, W, type Theme } from "../core";

function useAnimLoop(duration: number, cb: (t: number) => void) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    const ms = duration * 1000, pause = 600;
    let start: number | null = null, raf = 0;
    function loop(ts: number) {
      if (start === null) start = ts;
      const elapsed = (ts - start) % (ms + pause);
      cbRef.current(elapsed < ms ? elapsed / ms : 1);
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [duration]);
}

export function EasingCurve({ fn, color, width = W, height = H, duration, animated = false, th }: {
  fn: (t: number) => number;
  color: string;
  width?: number;
  height?: number;
  duration?: number;
  animated?: boolean;
  th: Theme;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useAnimLoop(duration ?? 1.0, t => { if (animated) draw(t); });

  function draw(progress: number | null) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pad = width < 260 ? 12 : PAD;
    const iw = width - pad * 2, ih = height - pad * 2;
    ctx.clearRect(0, 0, width, height);

    const samples: number[] = [];
    for (let i = 0; i <= 200; i++) {
      const p = i / 200;
      let v: number; try { v = fn(p); } catch { v = p; }
      samples.push(v);
    }
    const sMin = Math.min(...samples), sMax = Math.max(...samples);
    const vLo = Math.min(0, sMin), vHi = Math.max(1, sMax);
    const below = Math.max(0, -vLo), above = Math.max(0, vHi - 1);
    const vMin = vLo - below * 0.15, vMax = vHi + above * 0.15;
    const vRange = vMax - vMin;
    const toY = (v: number) => pad + ih - (v - vMin) / vRange * ih;

    ctx.strokeStyle = th.canvasGrid; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(pad + iw * i / 4, pad); ctx.lineTo(pad + iw * i / 4, pad + ih); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, pad + ih * i / 4); ctx.lineTo(pad + iw, pad + ih * i / 4); ctx.stroke();
    }
    ctx.strokeStyle = th.canvasAxis; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, pad + ih); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, toY(0)); ctx.lineTo(pad + iw, toY(0)); ctx.stroke();
    ctx.strokeStyle = th.canvasAxis; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(pad, toY(1)); ctx.lineTo(pad + iw, toY(1)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, toY(0)); ctx.lineTo(pad + iw, toY(1)); ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = color; ctx.lineWidth = width < 200 ? 2 : 3;
    ctx.shadowColor = color; ctx.shadowBlur = width < 200 ? 4 : 8;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const x = pad + (i / 200) * iw, y = toY(samples[i]);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.shadowBlur = 0;

    if (progress != null) {
      let v: number; try { v = fn(progress); } catch { v = progress; }
      const x = pad + progress * iw, y = toY(v);
      ctx.strokeStyle = th.canvasAxis; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(x, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, toY(0)); ctx.lineTo(x, y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      if (width >= 200) {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(pad + iw + 10, y, 4, 0, Math.PI * 2); ctx.fill();
      }
    }
    if (width >= 200) {
      ctx.fillStyle = th.textMuted; ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("0", pad, pad + ih + 16); ctx.fillText("1", pad + iw, pad + ih + 16);
      ctx.textAlign = "right";
      ctx.fillText("0", pad - 8, toY(0) + 4); ctx.fillText("1", pad - 8, toY(1) + 4);
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr; canvas.height = height * dpr;
    canvas.style.width = width + "px"; canvas.style.height = height + "px";
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.scale(dpr, dpr);
    if (!animated) draw(null);
  }, [fn, color, width, height, animated, th]);

  return <canvas ref={canvasRef} style={{ display: "block" }} />;
}

export function CombinedTracksCurve({ tracks, width = W, height = H, th }: {
  tracks: { label: string; fn: (t: number) => number; color: string }[];
  width?: number;
  height?: number;
  th: Theme;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr; canvas.height = height * dpr;
    canvas.style.width = width + "px"; canvas.style.height = height + "px";
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const pad = width < 260 ? 12 : PAD;
    const iw = width - pad * 2, ih = height - pad * 2;

    const allSamples: number[] = [];
    const sampled = tracks.map(tr => {
      const values: number[] = [];
      for (let i = 0; i <= 200; i++) {
        const p = i / 200;
        let v = p;
        try { v = tr.fn(p); } catch { }
        values.push(v);
        allSamples.push(v);
      }
      return values;
    });

    const sMin = allSamples.length ? Math.min(...allSamples) : 0;
    const sMax = allSamples.length ? Math.max(...allSamples) : 1;
    const vLo = Math.min(0, sMin), vHi = Math.max(1, sMax);
    const below = Math.max(0, -vLo), above = Math.max(0, vHi - 1);
    const vMin = vLo - below * 0.15, vMax = vHi + above * 0.15;
    const vRange = Math.max(1e-6, vMax - vMin);
    const toY = (v: number) => pad + ih - (v - vMin) / vRange * ih;

    ctx.strokeStyle = th.canvasGrid; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(pad + iw * i / 4, pad); ctx.lineTo(pad + iw * i / 4, pad + ih); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, pad + ih * i / 4); ctx.lineTo(pad + iw, pad + ih * i / 4); ctx.stroke();
    }
    ctx.strokeStyle = th.canvasAxis; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, pad + ih); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, toY(0)); ctx.lineTo(pad + iw, toY(0)); ctx.stroke();

    tracks.forEach((tr, idx) => {
      ctx.strokeStyle = tr.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      for (let i = 0; i <= 200; i++) {
        const x = pad + (i / 200) * iw, y = toY(sampled[idx][i]);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  }, [tracks, width, height, th]);

  return <canvas ref={canvasRef} style={{ display: "block" }} />;
}

export function BezierEditor({ cp, onChange, th }: { cp: number[]; onChange: (v: number[]) => void; th: Theme }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const [p, setP] = useState(cp);
  useEffect(() => { setP(cp); }, [cp]);
  const toSvg = (vx: number, vy: number): [number, number] => [PAD + vx * IW, PAD + IW - vy * IW];
  const fromSvg = (sx: number, sy: number): [number, number] => [(sx - PAD) / IW, (PAD + IW - sy) / IW];
  const [p1, p2] = [toSvg(p[0], p[1]), toSvg(p[2], p[3])];
  const start: [number, number] = [PAD, PAD + IW], end: [number, number] = [PAD + IW, PAD];
  const onMouseDown = (i: number, e: React.MouseEvent) => { e.preventDefault(); setDrag(i); };
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (drag === null) return;
    const rect = svgRef.current!.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (W / rect.width);
    const sy = (e.clientY - rect.top) * (H / rect.height);
    let [vx, vy] = fromSvg(sx, sy);
    vx = Math.max(0, Math.min(1, vx));
    const newP = [...p];
    if (drag === 0) { newP[0] = vx; newP[1] = vy; } else { newP[2] = vx; newP[3] = vy; }
    setP(newP); onChange(newP);
  }, [drag, p, onChange]);
  const onMouseUp = () => setDrag(null);
  return (
    <svg
      ref={svgRef}
      width={W}
      height={H}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{ cursor: drag !== null ? "grabbing" : "default", userSelect: "none" }}
    >
      {[0, 1, 2, 3, 4].map(i => (
        <g key={i}>
          <line x1={PAD + IW * i / 4} y1={PAD} x2={PAD + IW * i / 4} y2={PAD + IW} stroke={th.canvasGrid} strokeWidth="1" />
          <line x1={PAD} y1={PAD + IW * i / 4} x2={PAD + IW} y2={PAD + IW * i / 4} stroke={th.canvasGrid} strokeWidth="1" />
        </g>
      ))}
      <line x1={PAD} y1={PAD} x2={PAD} y2={PAD + IW} stroke={th.canvasAxis} strokeWidth="1.5" />
      <line x1={PAD} y1={PAD + IW} x2={PAD + IW} y2={PAD + IW} stroke={th.canvasAxis} strokeWidth="1.5" />
      <line x1={PAD} y1={PAD + IW} x2={PAD + IW} y2={PAD} stroke={th.canvasAxis} strokeDasharray="4 4" />
      <line x1={start[0]} y1={start[1]} x2={p1[0]} y2={p1[1]} stroke="#f97316" strokeWidth="1.5" strokeOpacity="0.6" />
      <line x1={end[0]} y1={end[1]} x2={p2[0]} y2={p2[1]} stroke="#22d3ee" strokeWidth="1.5" strokeOpacity="0.6" />
      <path
        d={`M ${start[0]} ${start[1]} C ${p1[0]} ${p1[1]}, ${p2[0]} ${p2[1]}, ${end[0]} ${end[1]}`}
        fill="none"
        stroke="#34d399"
        strokeWidth="3"
        style={{ filter: "drop-shadow(0 0 6px #34d399)" }}
      />
      {([[p1, 0, "#f97316"], [p2, 1, "#22d3ee"]] as [[number, number], number, string][]).map(([pt, i, col]) => (
        <g key={i} onMouseDown={e => onMouseDown(i, e)} style={{ cursor: "grab" }}>
          <circle cx={pt[0]} cy={pt[1]} r={10} fill="transparent" />
          <circle cx={pt[0]} cy={pt[1]} r={7} fill={col} stroke={th.panel} strokeWidth="2" style={{ filter: `drop-shadow(0 0 4px ${col})` }} />
          <circle cx={pt[0]} cy={pt[1]} r={3} fill={th.panel} />
        </g>
      ))}
      <text x={PAD} y={PAD + IW + 16} textAnchor="middle" fill={th.textMuted} fontSize="11" fontFamily="monospace">0</text>
      <text x={PAD + IW} y={PAD + IW + 16} textAnchor="middle" fill={th.textMuted} fontSize="11" fontFamily="monospace">1</text>
      <text x={PAD - 8} y={PAD + IW + 4} textAnchor="end" fill={th.textMuted} fontSize="11" fontFamily="monospace">0</text>
      <text x={PAD - 8} y={PAD + 4} textAnchor="end" fill={th.textMuted} fontSize="11" fontFamily="monospace">1</text>
    </svg>
  );
}

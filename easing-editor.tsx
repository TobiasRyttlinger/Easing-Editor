import { useState, useRef, useEffect, useCallback, useMemo } from "react";

const W = 320, H = 320, PAD = 40, IW = W - PAD * 2;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function easeOutBounce(t: number) {
  const n1 = 7.5625, d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}

const easings: Record<string, (t: number) => number> = {
  linear: t => t,
  easeInSine: t => 1 - Math.cos(t * Math.PI / 2),
  easeOutSine: t => Math.sin(t * Math.PI / 2),
  easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
  easeInQuad: t => t * t,
  easeOutQuad: t => 1 - (1 - t) ** 2,
  easeInOutQuad: t => t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2,
  easeInCubic: t => t ** 3,
  easeOutCubic: t => 1 - (1 - t) ** 3,
  easeInOutCubic: t => t < 0.5 ? 4 * t ** 3 : 1 - ((-2 * t + 2) ** 3) / 2,
  easeInQuart: t => t ** 4,
  easeOutQuart: t => 1 - (1 - t) ** 4,
  easeInOutQuart: t => t < 0.5 ? 8 * t ** 4 : 1 - ((-2 * t + 2) ** 4) / 2,
  easeInExpo: t => t === 0 ? 0 : 2 ** (10 * t - 10),
  easeOutExpo: t => t === 1 ? 1 : 1 - 2 ** (-10 * t),
  easeInOutExpo: t => t === 0 || t === 1 ? t : t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2,
  easeInCirc: t => 1 - Math.sqrt(1 - t * t),
  easeOutCirc: t => Math.sqrt(1 - (t - 1) ** 2),
  easeInOutCirc: t => t < 0.5 ? (1 - Math.sqrt(1 - (2 * t) ** 2)) / 2 : (Math.sqrt(1 - (-2 * t + 2) ** 2) + 1) / 2,
  easeInBack: t => { const c1 = 1.70158; return (c1 + 1) * t ** 3 - c1 * t * t; },
  easeOutBack: t => { const c1 = 1.70158; return 1 + (c1 + 1) * (t - 1) ** 3 + c1 * (t - 1) ** 2; },
  easeInOutBack: t => {
    const c2 = 2.5949095;
    return t < 0.5 ? ((2 * t) ** 2 * ((c2 + 1) * 2 * t - c2)) / 2 : (((2 * t - 2) ** 2 * ((c2 + 1) * (2 * t - 2) + c2)) + 2) / 2;
  },
  easeInElastic: t => t === 0 ? 0 : t === 1 ? 1 : -(2 ** (10 * t - 10)) * Math.sin((t * 10 - 10.75) * (2 * Math.PI) / 3),
  easeOutElastic: t => t === 0 ? 0 : t === 1 ? 1 : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1,
  easeInOutElastic: t => {
    if (t === 0 || t === 1) return t;
    return t < 0.5
      ? -(2 ** (20 * t - 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI) / 4.5)) / 2
      : (2 ** (-20 * t + 10) * Math.sin((20 * t - 11.125) * (2 * Math.PI) / 4.5)) / 2 + 1;
  },
  easeInBounce: t => 1 - easeOutBounce(1 - t),
  easeOutBounce,
  easeInOutBounce: t => t < 0.5 ? (1 - easeOutBounce(1 - 2 * t)) / 2 : (1 + easeOutBounce(2 * t - 1)) / 2,
};

function cubicBezier(p1x: number, p1y: number, p2x: number, p2y: number) {
  return (t: number) => {
    const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
    const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
    const sampleX = (v: number) => ((ax * v + bx) * v + cx) * v;
    const sampleY = (v: number) => ((ay * v + by) * v + cy) * v;
    let s = t;
    for (let i = 0; i < 8; i++) {
      const dx = sampleX(s) - t;
      const ds = 3 * ax * s * s + 2 * bx * s + cx;
      if (Math.abs(ds) < 1e-6) break;
      s -= dx / ds;
    }
    return sampleY(clamp01(s));
  };
}

type CombineMode = "none" | "yoyo" | "composite" | "multiply" | "connect" | "average" | "lerp" | "clamp" | "repeat" | "zigzag" | "crossfade";

const combineModes: { id: CombineMode; label: string }[] = [
  { id: "none", label: "None" },
  { id: "yoyo", label: "Yoyo" },
  { id: "composite", label: "Composite" },
  { id: "multiply", label: "Multiply" },
  { id: "connect", label: "Connect" },
  { id: "average", label: "Average" },
  { id: "lerp", label: "Lerp" },
  { id: "clamp", label: "Clamp" },
  { id: "repeat", label: "Repeat" },
  { id: "zigzag", label: "Zigzag" },
  { id: "crossfade", label: "Crossfade" },
];

function makeCombined(
  mode: CombineMode,
  aFn: (t: number) => number,
  bFn: (t: number) => number,
  mix: number,
  repeatCount: number,
  minV: number,
  maxV: number,
) {
  const m = clamp01(mix);
  const count = Math.max(1, Math.floor(repeatCount));
  const lo = Math.min(minV, maxV);
  const hi = Math.max(minV, maxV);
  return (tRaw: number): number => {
    const t = clamp01(tRaw);
    const a = clamp01(aFn(t));
    const b = clamp01(bFn(t));
    switch (mode) {
      case "yoyo": { const p = t < 0.5 ? t * 2 : (1 - t) * 2; return clamp01(aFn(p)); }
      case "composite": return clamp01(aFn(b));
      case "multiply": return clamp01(a * b);
      case "connect": return t < 0.5 ? 0.5 * clamp01(aFn(t * 2)) : 0.5 + 0.5 * clamp01(bFn((t - 0.5) * 2));
      case "average": return clamp01((a + b) * 0.5);
      case "lerp": return clamp01(lerp(a, b, m));
      case "clamp": return Math.max(lo, Math.min(hi, a));
      case "repeat": return clamp01(aFn((t * count) % 1));
      case "zigzag": { const cyc = t * count; const whole = Math.floor(cyc); const frac = cyc - whole; return clamp01(aFn(whole % 2 === 0 ? frac : 1 - frac)); }
      case "crossfade": return clamp01(lerp(a, b, t));
      default: return a;
    }
  };
}

const categories: Record<string, string[]> = {
  "Sine": ["easeInSine", "easeOutSine", "easeInOutSine"],
  "Quad": ["easeInQuad", "easeOutQuad", "easeInOutQuad"],
  "Cubic": ["easeInCubic", "easeOutCubic", "easeInOutCubic"],
  "Quart": ["easeInQuart", "easeOutQuart", "easeInOutQuart"],
  "Expo": ["easeInExpo", "easeOutExpo", "easeInOutExpo"],
  "Circ": ["easeInCirc", "easeOutCirc", "easeInOutCirc"],
  "Back": ["easeInBack", "easeOutBack", "easeInOutBack"],
  "Elastic": ["easeInElastic", "easeOutElastic", "easeInOutElastic"],
  "Bounce": ["easeInBounce", "easeOutBounce", "easeInOutBounce"],
};

function getColor(name: string) {
  if (name === "customCubicBezier") return "#34d399";
  if (name.startsWith("easeInOut")) return "#a78bfa";
  if (name.startsWith("easeIn")) return "#f97316";
  if (name.startsWith("easeOut")) return "#22d3ee";
  return "#6b7280";
}

// Shared animation loop hook
function useAnimLoop(duration: number, cb: (t: number) => void) {
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    const ms = duration * 1000;
    const pause = 600;
    let start: number | null = null;
    let raf = 0;
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

// Easing curve canvas — draws grid, glowing curve, and animated dot
function EasingCurve({ fn, color, width = W, height = H, duration, animated = false }: {
  fn: (t: number) => number;
  color: string;
  width?: number;
  height?: number;
  duration?: number;
  animated?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tRef = useRef<number | null>(null);

  useAnimLoop(duration ?? 1.8, t => { if (animated) { tRef.current = t; draw(t); } });

  function draw(progress: number | null) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pad = width < 200 ? 12 : PAD;
    const iw = width - pad * 2;
    const ih = height - pad * 2;
    ctx.clearRect(0, 0, width, height);
    // grid
    ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(pad + iw * i / 4, pad); ctx.lineTo(pad + iw * i / 4, pad + ih); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, pad + ih * i / 4); ctx.lineTo(pad + iw, pad + ih * i / 4); ctx.stroke();
    }
    ctx.strokeStyle = "#334155"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, pad + ih); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, pad + ih); ctx.lineTo(pad + iw, pad + ih); ctx.stroke();
    ctx.strokeStyle = "#334155"; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(pad, pad + ih); ctx.lineTo(pad + iw, pad); ctx.stroke();
    ctx.setLineDash([]);
    // curve with glow
    ctx.strokeStyle = color; ctx.lineWidth = width < 200 ? 2 : 3;
    ctx.shadowColor = color; ctx.shadowBlur = width < 200 ? 4 : 8;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const p = i / 200;
      let v: number; try { v = fn(p); } catch { v = p; }
      const x = pad + p * iw, y = pad + ih - clamp01(v) * ih;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.shadowBlur = 0;
    // animated dot with crosshairs
    if (progress != null) {
      let v: number; try { v = fn(progress); } catch { v = progress; }
      v = clamp01(v);
      const x = pad + progress * iw, y = pad + ih - v * ih;
      ctx.strokeStyle = "#475569"; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(x, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, pad + ih); ctx.lineTo(x, y); ctx.stroke();
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
      ctx.fillStyle = "#64748b"; ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText("0", pad, pad + ih + 16); ctx.fillText("1", pad + iw, pad + ih + 16);
      ctx.textAlign = "right";
      ctx.fillText("0", pad - 8, pad + ih + 4); ctx.fillText("1", pad - 8, pad + 4);
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
  }, [fn, color, width, height, animated]);

  return <canvas ref={canvasRef} style={{ display: "block" }} />;
}

// Bézier Editor SVG with draggable control points
function BezierEditor({ cp, onChange }: { cp: number[]; onChange: (v: number[]) => void }) {
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
  }, [drag, p]);
  const onMouseUp = () => setDrag(null);
  return (
    <svg ref={svgRef} width={W} height={H} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
      style={{ cursor: drag !== null ? "grabbing" : "default", userSelect: "none" }}>
      {[0, 1, 2, 3, 4].map(i => (
        <g key={i}>
          <line x1={PAD + IW * i / 4} y1={PAD} x2={PAD + IW * i / 4} y2={PAD + IW} stroke="#1e293b" strokeWidth="1" />
          <line x1={PAD} y1={PAD + IW * i / 4} x2={PAD + IW} y2={PAD + IW * i / 4} stroke="#1e293b" strokeWidth="1" />
        </g>
      ))}
      <line x1={PAD} y1={PAD} x2={PAD} y2={PAD + IW} stroke="#334155" strokeWidth="1.5" />
      <line x1={PAD} y1={PAD + IW} x2={PAD + IW} y2={PAD + IW} stroke="#334155" strokeWidth="1.5" />
      <line x1={PAD} y1={PAD + IW} x2={PAD + IW} y2={PAD} stroke="#334155" strokeDasharray="4 4" />
      <line x1={start[0]} y1={start[1]} x2={p1[0]} y2={p1[1]} stroke="#f97316" strokeWidth="1.5" strokeOpacity="0.6" />
      <line x1={end[0]} y1={end[1]} x2={p2[0]} y2={p2[1]} stroke="#22d3ee" strokeWidth="1.5" strokeOpacity="0.6" />
      <path d={`M ${start[0]} ${start[1]} C ${p1[0]} ${p1[1]}, ${p2[0]} ${p2[1]}, ${end[0]} ${end[1]}`}
        fill="none" stroke="#34d399" strokeWidth="3" style={{ filter: "drop-shadow(0 0 6px #34d399)" }} />
      {([[p1, 0, "#f97316"], [p2, 1, "#22d3ee"]] as [[number, number], number, string][]).map(([pt, i, col]) => (
        <g key={i} onMouseDown={e => onMouseDown(i, e)} style={{ cursor: "grab" }}>
          <circle cx={pt[0]} cy={pt[1]} r={10} fill="transparent" />
          <circle cx={pt[0]} cy={pt[1]} r={7} fill={col} stroke="#0f172a" strokeWidth="2"
            style={{ filter: `drop-shadow(0 0 4px ${col})` }} />
          <circle cx={pt[0]} cy={pt[1]} r={3} fill="#0f172a" />
        </g>
      ))}
      <text x={PAD} y={PAD + IW + 16} textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="monospace">0</text>
      <text x={PAD + IW} y={PAD + IW + 16} textAnchor="middle" fill="#64748b" fontSize="11" fontFamily="monospace">1</text>
      <text x={PAD - 8} y={PAD + IW + 4} textAnchor="end" fill="#64748b" fontSize="11" fontFamily="monospace">0</text>
      <text x={PAD - 8} y={PAD + 4} textAnchor="end" fill="#64748b" fontSize="11" fontFamily="monospace">1</text>
    </svg>
  );
}

const templates = [
  { id: "slide" }, { id: "fade" }, { id: "scale" }, { id: "rotate" }, { id: "bounce-y" },
];

function TemplatePreview({ fn, color, template, duration }: {
  fn: (t: number) => number; color: string; template: string; duration: number;
}) {
  const [t, setT] = useState(0);
  useAnimLoop(duration, setT);
  let v = 0; try { v = clamp01(fn(t)); } catch {}

  const CardFace = ({ style }: { style?: React.CSSProperties }) => (
    <div style={{
      width: 56, height: 72,
      background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
      borderRadius: 8, border: `2px solid ${color}44`, boxShadow: `0 0 12px ${color}33`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
      ...style
    }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", background: color, opacity: 0.9, boxShadow: `0 0 8px ${color}` }} />
      <div style={{ width: 32, height: 3, borderRadius: 2, background: color, opacity: 0.5 }} />
      <div style={{ width: 22, height: 3, borderRadius: 2, background: color, opacity: 0.3 }} />
    </div>
  );

  const trackW = 240;
  let inner: React.ReactNode = null;

  if (template === "slide") {
    const x = v * (trackW - 60);
    inner = (
      <div style={{ position: "relative", width: trackW, height: 80, display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "#1e293b", borderRadius: 1, top: "50%" }} />
        <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 2, height: 24, background: "#334155" }} />
        <div style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: 2, height: 24, background: "#334155" }} />
        <div style={{ position: "absolute", left: x, top: "50%", transform: "translateY(-50%)" }}><CardFace /></div>
      </div>
    );
  } else if (template === "fade") {
    inner = (
      <div style={{ position: "relative", width: trackW, height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 11, color: "#475569", position: "absolute", left: 12 }}>0%</div>
        <div style={{ fontSize: 11, color: "#475569", position: "absolute", right: 12 }}>100%</div>
        <CardFace style={{ opacity: v }} />
      </div>
    );
  } else if (template === "scale") {
    const s = 0.2 + v * 0.8;
    inner = (
      <div style={{ width: trackW, height: 90, display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
        <div style={{ fontSize: 11, color: "#475569", textAlign: "center" }}>
          <div style={{ fontFamily: "monospace", color }}>scale</div>
          <div>{s.toFixed(2)}</div>
        </div>
        <div style={{ transform: `scale(${s})`, transformOrigin: "center" }}><CardFace /></div>
      </div>
    );
  } else if (template === "rotate") {
    const deg = v * 360;
    inner = (
      <div style={{ width: trackW, height: 90, display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
        <div style={{ fontSize: 11, color: "#475569", textAlign: "center" }}>
          <div style={{ fontFamily: "monospace", color }}>rotate</div>
          <div>{Math.round(deg)}°</div>
        </div>
        <div style={{ transform: `rotate(${deg}deg)` }}><CardFace /></div>
      </div>
    );
  } else if (template === "bounce-y") {
    const y = -30 + v * 60;
    inner = (
      <div style={{ position: "relative", width: trackW, height: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
        <div style={{ position: "absolute", bottom: 8, left: 20, right: 20, height: 2, background: "#334155", borderRadius: 1 }} />
        <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", width: 30 + v * 30, height: 6, borderRadius: "50%", background: color, opacity: 0.1 + v * 0.2, filter: "blur(4px)" }} />
        <div style={{ transform: `translateY(${y}px)`, marginBottom: 10 }}><CardFace /></div>
      </div>
    );
  }

  return (
    <div style={{ background: "#0f172a", borderRadius: 10, padding: "10px 14px", border: "1px solid #1e293b", display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{template}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 100 }}>{inner}</div>
    </div>
  );
}

function TrailPreview({ fn, color, duration }: { fn: (t: number) => number; color: string; duration: number }) {
  const [t, setT] = useState(0);
  useAnimLoop(duration, setT);
  let v = 0; try { v = clamp01(fn(t)); } catch {}
  const trackW = 220;
  const x = 4 + v * (trackW - 16);
  const ghosts = [0.95, 0.9, 0.82, 0.72, 0.6].map(offset => {
    const gt = Math.max(0, t - (1 - offset) * 0.15);
    let gv = 0; try { gv = clamp01(fn(gt)); } catch {}
    return 4 + gv * (trackW - 16);
  });
  return (
    <div style={{ background: "#0f172a", borderRadius: 10, padding: "10px 14px", border: "1px solid #1e293b" }}>
      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Trail</div>
      <div style={{ position: "relative", height: 32, display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "#1e293b", borderRadius: 1, top: "50%" }} />
        {ghosts.map((gx, i) => (
          <div key={i} style={{ position: "absolute", left: gx, top: "50%", transform: "translate(-50%, -50%)", width: 10 - i, height: 10 - i, borderRadius: "50%", background: color, opacity: 0.08 + (ghosts.length - i) * 0.04 }} />
        ))}
        <div style={{ position: "absolute", left: x, top: "50%", transform: "translate(-50%, -50%)", width: 14, height: 14, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} />
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  background: "#111827", color: "#cbd5e1", border: "1px solid #334155",
  borderRadius: 6, padding: "6px 8px", fontSize: 12, cursor: "pointer",
};

export default function App() {
  const [selected, setSelected] = useState("easeInOutCubic");
  const [cp, setCp] = useState([0.25, 0.1, 0.25, 1.0]);
  const [tab, setTab] = useState<"library" | "bezier" | "compare">("library");

  const [mode, setMode] = useState<CombineMode>("none");
  const [secondary, setSecondary] = useState("easeOutBounce");
  const [mix, setMix] = useState(0.5);
  const [repeatCount, setRepeatCount] = useState(3);
  const [clampMin, setClampMin] = useState(0.15);
  const [clampMax, setClampMax] = useState(0.85);

  const [duration, setDuration] = useState(1.8);

  const customFn = useMemo(() => cubicBezier(cp[0], cp[1], cp[2], cp[3]), [cp]);
  const getFn = (name: string) => name === "customCubicBezier" ? customFn : (easings[name] || easings.linear);
  const activeFn = getFn(selected);
  const fnB = getFn(secondary);
  const finalFn = useMemo(() => makeCombined(mode, activeFn, fnB, mix, repeatCount, clampMin, clampMax), [mode, activeFn, fnB, mix, repeatCount, clampMin, clampMax]);
  const activeColor = mode !== "none" ? "#f59e0b" : getColor(selected);

  const allNames = [...Object.values(categories).flat(), "linear", "customCubicBezier"];
  const comparePicks = ["easeInCubic", "easeOutCubic", "easeInOutCubic", "easeInElastic", "easeOutBounce", "easeInBack"];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", color: "#e2e8f0", fontFamily: "'Inter', sans-serif", padding: "24px 16px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 20, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, background: "linear-gradient(90deg, #818cf8, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              ✦ Easing Editor
            </h1>
            <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>Visualize & customize animation easing curves</p>
          </div>
          <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 10, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ color: "#64748b", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Duration</span>
            <input
              type="range" min={0.1} max={2.0} step={0.1} value={duration}
              onChange={e => setDuration(parseFloat(e.target.value))}
              style={{ width: 120, accentColor: "#34d399" }}
            />
            <span style={{ color: "#34d399", fontFamily: "monospace", fontSize: 13, minWidth: 32 }}>{duration.toFixed(1)}s</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {(["library", "bezier", "compare"] as const).map(id => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: tab === id ? "#818cf8" : "#1e293b", color: tab === id ? "#fff" : "#94a3b8", transition: "all 0.2s",
            }}>
              {id === "library" ? "📚 Library" : id === "bezier" ? "🎛 Bézier" : "⚖️ Compare"}
            </button>
          ))}
        </div>

        {/* Combine panel */}
        <div style={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: "12px 14px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Combine</div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, color: "#64748b" }}>Mode</span>
              <select value={mode} onChange={e => setMode(e.target.value as CombineMode)} style={selectStyle}>
                {combineModes.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </div>
            {mode !== "none" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 11, color: "#64748b" }}>Secondary</span>
                <select value={secondary} onChange={e => setSecondary(e.target.value)} style={selectStyle}>
                  {allNames.map(n => <option key={n}>{n}</option>)}
                </select>
              </div>
            )}
            {(mode === "lerp" || mode === "average") && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 160 }}>
                <span style={{ fontSize: 11, color: "#64748b" }}>Mix: {mix.toFixed(2)}</span>
                <input type="range" min={0} max={1} step={0.01} value={mix} onChange={e => setMix(parseFloat(e.target.value))} style={{ accentColor: "#f59e0b" }} />
              </div>
            )}
            {(mode === "repeat" || mode === "zigzag") && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 160 }}>
                <span style={{ fontSize: 11, color: "#64748b" }}>Count: {repeatCount}</span>
                <input type="range" min={1} max={12} step={1} value={repeatCount} onChange={e => setRepeatCount(parseInt(e.target.value, 10))} style={{ accentColor: "#f59e0b" }} />
              </div>
            )}
            {mode === "clamp" && (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 140 }}>
                  <span style={{ fontSize: 11, color: "#64748b" }}>Min: {clampMin.toFixed(2)}</span>
                  <input type="range" min={0} max={1} step={0.01} value={clampMin} onChange={e => setClampMin(parseFloat(e.target.value))} style={{ accentColor: "#f59e0b" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 140 }}>
                  <span style={{ fontSize: 11, color: "#64748b" }}>Max: {clampMax.toFixed(2)}</span>
                  <input type="range" min={0} max={1} step={0.01} value={clampMax} onChange={e => setClampMax(parseFloat(e.target.value))} style={{ accentColor: "#f59e0b" }} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Library Tab */}
        {tab === "library" && (
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {/* Sidebar */}
            <div style={{ flex: "0 0 200px" }}>
              <div style={{ background: "#0f172a", borderRadius: 12, padding: 12, border: "1px solid #1e293b" }}>
                <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Easing Types</div>
                {Object.entries(categories).map(([cat, names]) => (
                  <div key={cat} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: "#475569", marginBottom: 3, fontWeight: 600 }}>{cat}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {names.map(n => {
                        const col = getColor(n);
                        const isActive = selected === n;
                        return (
                          <button key={n} onClick={() => setSelected(n)} style={{
                            padding: "4px 8px", borderRadius: 5, border: `1px solid ${isActive ? col : "transparent"}`,
                            background: isActive ? col + "22" : "transparent", color: isActive ? col : "#94a3b8",
                            cursor: "pointer", fontSize: 11, textAlign: "left", fontFamily: "monospace",
                          }}>{n}</button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div style={{ borderTop: "1px solid #1e293b", marginTop: 8, paddingTop: 8 }}>
                  <button onClick={() => setSelected("linear")} style={{
                    padding: "4px 8px", borderRadius: 5, border: `1px solid ${selected === "linear" ? "#6b7280" : "transparent"}`,
                    background: selected === "linear" ? "#6b728022" : "transparent", color: selected === "linear" ? "#6b7280" : "#94a3b8",
                    cursor: "pointer", fontSize: 11, fontFamily: "monospace", width: "100%", textAlign: "left",
                  }}>linear</button>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
                {/* Curve */}
                <div style={{ background: "#0f172a", borderRadius: 12, padding: 12, border: "1px solid #1e293b" }}>
                  <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Curve</div>
                  <EasingCurve fn={finalFn} color={activeColor} animated duration={duration} />
                </div>
                {/* Template previews */}
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                    Template Previews
                    <span style={{ marginLeft: 8, color: activeColor, fontFamily: "monospace", textTransform: "none", fontSize: 11 }}>{selected}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {templates.map(({ id }) => (
                      <TemplatePreview key={id} fn={finalFn} color={activeColor} template={id} duration={duration} />
                    ))}
                    <TrailPreview fn={finalFn} color={activeColor} duration={duration} />
                  </div>
                </div>
              </div>

              {/* Mini grid */}
              <div style={{ background: "#0f172a", borderRadius: 12, padding: 14, border: "1px solid #1e293b" }}>
                <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>All Curves</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: 6 }}>
                  {[...Object.values(categories).flat(), "linear"].map(n => (
                    <div key={n} onClick={() => setSelected(n)} style={{
                      cursor: "pointer", borderRadius: 6, border: `1px solid ${selected === n ? getColor(n) : "#1e293b"}`,
                      overflow: "hidden", background: selected === n ? getColor(n) + "11" : "#0a0f1e", transition: "border-color 0.15s",
                    }}>
                      <EasingCurve fn={easings[n] ?? (t => t)} color={getColor(n)} width={72} height={72} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bézier Tab */}
        {tab === "bezier" && (
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div>
              <div style={{ background: "#0f172a", borderRadius: 12, padding: 12, border: "1px solid #1e293b" }}>
                <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Drag control points</div>
                <BezierEditor cp={cp} onChange={v => { setCp(v); setSelected("customCubicBezier"); }} />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ background: "#0f172a", borderRadius: 12, padding: 16, border: "1px solid #1e293b", marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Parameters</div>
                {([["P1 X", 0], ["P1 Y", 1], ["P2 X", 2], ["P2 Y", 3]] as [string, number][]).map(([label, i]) => (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: "#94a3b8", fontFamily: "monospace" }}>{label}</span>
                      <span style={{ color: "#34d399", fontFamily: "monospace" }}>{cp[i].toFixed(3)}</span>
                    </div>
                    <input type="range" min={i % 2 === 0 ? 0 : -2} max={i % 2 === 0 ? 1 : 3} step={0.001} value={cp[i]}
                      onChange={e => { const n = [...cp]; n[i] = parseFloat(e.target.value); setCp(n); setSelected("customCubicBezier"); }}
                      style={{ width: "100%", accentColor: "#34d399" }} />
                  </div>
                ))}
                <div style={{ marginTop: 12, padding: "10px 12px", background: "#0a0f1e", borderRadius: 6, fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>
                  <span style={{ color: "#818cf8" }}>cubic-bezier</span>(<span style={{ color: "#34d399" }}>{cp.map(v => v.toFixed(3)).join(", ")}</span>)
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#475569", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Template Previews</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {templates.map(({ id }) => (
                  <TemplatePreview key={id} fn={customFn} color="#34d399" template={id} duration={duration} />
                ))}
                <TrailPreview fn={customFn} color="#34d399" duration={duration} />
              </div>
            </div>
          </div>
        )}

        {/* Compare Tab */}
        {tab === "compare" && (
          <div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>Comparing 6 common easing curves side by side</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {comparePicks.map(n => {
                const fn = easings[n];
                const col = getColor(n);
                return (
                  <div key={n} onClick={() => { setSelected(n); setTab("library"); }} style={{
                    background: "#0f172a", borderRadius: 12, padding: 12, border: "1px solid #1e293b",
                    cursor: "pointer", transition: "border-color 0.2s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = col)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = "#1e293b")}>
                    <div style={{ fontSize: 12, color: col, fontFamily: "monospace", marginBottom: 8, fontWeight: 600 }}>{n}</div>
                    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                      <EasingCurve fn={fn} color={col} width={160} height={160} animated duration={duration} />
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, paddingTop: 4 }}>
                        <TemplatePreview fn={fn} color={col} template="slide" duration={duration} />
                        <TemplatePreview fn={fn} color={col} template="scale" duration={duration} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

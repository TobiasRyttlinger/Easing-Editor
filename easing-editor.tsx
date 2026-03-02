import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const W = 320, H = 320, PAD = 40, IW = W - PAD * 2;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ── Theme ────────────────────────────────────────────────────────────────────

type Theme = {
  bg: string;
  panel: string;
  border: string;
  text: string;
  textSub: string;
  textMuted: string;
  canvasGrid: string;
  canvasAxis: string;
  inputBg: string;
};

const darkTheme: Theme = {
  bg: "#0a0f1e",
  panel: "#0f172a",
  border: "#1e293b",
  text: "#e2e8f0",
  textSub: "#94a3b8",
  textMuted: "#64748b",
  canvasGrid: "#1e293b",
  canvasAxis: "#334155",
  inputBg: "#111827",
};

const lightTheme: Theme = {
  bg: "#f0f4f8",
  panel: "#ffffff",
  border: "#dde3ea",
  text: "#0f172a",
  textSub: "#475569",
  textMuted: "#94a3b8",
  canvasGrid: "#e2e8f0",
  canvasAxis: "#cbd5e1",
  inputBg: "#f8fafc",
};

// ── Easing functions ─────────────────────────────────────────────────────────

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

// ── Combine modes ─────────────────────────────────────────────────────────────

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
  mix: number, repeatCount: number, minV: number, maxV: number,
) {
  const m = clamp01(mix);
  const count = Math.max(1, Math.floor(repeatCount));
  const lo = Math.min(minV, maxV), hi = Math.max(minV, maxV);
  return (tRaw: number): number => {
    const t = clamp01(tRaw);
    const a = aFn(t), b = bFn(t);
    switch (mode) {
      case "yoyo": { const p = t < 0.5 ? t * 2 : (1 - t) * 2; return aFn(p); }
      case "composite": return aFn(clamp01(b));
      case "multiply": return a * b;
      case "connect": return t < 0.5 ? 0.5 * aFn(t * 2) : 0.5 + 0.5 * bFn((t - 0.5) * 2);
      case "average": return (a + b) * 0.5;
      case "lerp": return lerp(a, b, m);
      case "clamp": return Math.max(lo, Math.min(hi, a));
      case "repeat": return aFn((t * count) % 1);
      case "zigzag": { const cyc = t * count; const whole = Math.floor(cyc); const frac = cyc - whole; return aFn(whole % 2 === 0 ? frac : 1 - frac); }
      case "crossfade": return lerp(a, b, t);
      default: return a;
    }
  };
}

// ── Tween node tree ───────────────────────────────────────────────────────────

type TweenNode =
  | { type: "simple"; name: string }
  | { type: "op"; mode: CombineMode; a: TweenNode; b: TweenNode;
      mix: number; repeatCount: number; clampMin: number; clampMax: number };

function evalNode(node: TweenNode, customFn: (t: number) => number): (t: number) => number {
  if (node.type === "simple")
    return node.name === "customCubicBezier" ? customFn : (easings[node.name] ?? easings.linear);
  const aFn = evalNode(node.a, customFn);
  const bFn = evalNode(node.b, customFn);
  return makeCombined(node.mode, aFn, bFn, node.mix, node.repeatCount, node.clampMin, node.clampMax);
}

// ── Drag-and-drop path utilities ──────────────────────────────────────────────

function getNodeAtPath(root: TweenNode, path: string[]): TweenNode {
  if (path.length === 0) return root;
  if (root.type !== "op") return root;
  const [h, ...rest] = path;
  return getNodeAtPath(h === "a" ? root.a : root.b, rest);
}

function setNodeAtPath(root: TweenNode, path: string[], value: TweenNode): TweenNode {
  if (path.length === 0) return value;
  if (root.type !== "op") return root;
  const [h, ...rest] = path;
  return h === "a"
    ? { ...root, a: setNodeAtPath(root.a, rest, value) }
    : { ...root, b: setNodeAtPath(root.b, rest, value) };
}

// Returns true if anc is a prefix of (or equal to) desc
function isAncestorOrSame(anc: string[], desc: string[]): boolean {
  return anc.length <= desc.length && anc.every((v, i) => desc[i] === v);
}

type DragCtx = {
  dragging: string[] | null;
  setDragging: (p: string[] | null) => void;
  swap: (a: string[], b: string[]) => void;
};

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

// ── Shared animation loop hook ────────────────────────────────────────────────

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

// ── EasingCurve canvas ────────────────────────────────────────────────────────

function EasingCurve({ fn, color, width = W, height = H, duration, animated = false, th }: {
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

    // Pre-sample to find actual value range
    const samples: number[] = [];
    for (let i = 0; i <= 200; i++) {
      const p = i / 200;
      let v: number; try { v = fn(p); } catch { v = p; }
      samples.push(v);
    }
    const sMin = Math.min(...samples), sMax = Math.max(...samples);
    const vLo = Math.min(0, sMin), vHi = Math.max(1, sMax);
    // Only add margin for the overshoot portion; normal curves (no overshoot) stay exact
    const below = Math.max(0, -vLo), above = Math.max(0, vHi - 1);
    const vMin = vLo - below * 0.15, vMax = vHi + above * 0.15;
    const vRange = vMax - vMin;
    const toY = (v: number) => pad + ih - (v - vMin) / vRange * ih;

    // grid
    ctx.strokeStyle = th.canvasGrid; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(pad + iw * i / 4, pad); ctx.lineTo(pad + iw * i / 4, pad + ih); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(pad, pad + ih * i / 4); ctx.lineTo(pad + iw, pad + ih * i / 4); ctx.stroke();
    }
    // left axis + v=0 baseline
    ctx.strokeStyle = th.canvasAxis; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad, pad); ctx.lineTo(pad, pad + ih); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, toY(0)); ctx.lineTo(pad + iw, toY(0)); ctx.stroke();
    // v=1 reference + linear diagonal (dashed)
    ctx.strokeStyle = th.canvasAxis; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(pad, toY(1)); ctx.lineTo(pad + iw, toY(1)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pad, toY(0)); ctx.lineTo(pad + iw, toY(1)); ctx.stroke();
    ctx.setLineDash([]);
    // curve with glow
    ctx.strokeStyle = color; ctx.lineWidth = width < 200 ? 2 : 3;
    ctx.shadowColor = color; ctx.shadowBlur = width < 200 ? 4 : 8;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const x = pad + (i / 200) * iw, y = toY(samples[i]);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.shadowBlur = 0;
    // animated dot with crosshairs
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

// ── Bézier Editor SVG ─────────────────────────────────────────────────────────

function BezierEditor({ cp, onChange, th }: { cp: number[]; onChange: (v: number[]) => void; th: Theme }) {
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
          <line x1={PAD + IW * i / 4} y1={PAD} x2={PAD + IW * i / 4} y2={PAD + IW} stroke={th.canvasGrid} strokeWidth="1" />
          <line x1={PAD} y1={PAD + IW * i / 4} x2={PAD + IW} y2={PAD + IW * i / 4} stroke={th.canvasGrid} strokeWidth="1" />
        </g>
      ))}
      <line x1={PAD} y1={PAD} x2={PAD} y2={PAD + IW} stroke={th.canvasAxis} strokeWidth="1.5" />
      <line x1={PAD} y1={PAD + IW} x2={PAD + IW} y2={PAD + IW} stroke={th.canvasAxis} strokeWidth="1.5" />
      <line x1={PAD} y1={PAD + IW} x2={PAD + IW} y2={PAD} stroke={th.canvasAxis} strokeDasharray="4 4" />
      <line x1={start[0]} y1={start[1]} x2={p1[0]} y2={p1[1]} stroke="#f97316" strokeWidth="1.5" strokeOpacity="0.6" />
      <line x1={end[0]} y1={end[1]} x2={p2[0]} y2={p2[1]} stroke="#22d3ee" strokeWidth="1.5" strokeOpacity="0.6" />
      <path d={`M ${start[0]} ${start[1]} C ${p1[0]} ${p1[1]}, ${p2[0]} ${p2[1]}, ${end[0]} ${end[1]}`}
        fill="none" stroke="#34d399" strokeWidth="3" style={{ filter: "drop-shadow(0 0 6px #34d399)" }} />
      {([[p1, 0, "#f97316"], [p2, 1, "#22d3ee"]] as [[number, number], number, string][]).map(([pt, i, col]) => (
        <g key={i} onMouseDown={e => onMouseDown(i, e)} style={{ cursor: "grab" }}>
          <circle cx={pt[0]} cy={pt[1]} r={10} fill="transparent" />
          <circle cx={pt[0]} cy={pt[1]} r={7} fill={col} stroke={th.panel} strokeWidth="2"
            style={{ filter: `drop-shadow(0 0 4px ${col})` }} />
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

// ── Template Previews ─────────────────────────────────────────────────────────

const templates = [
  { id: "slide" }, { id: "fade" }, { id: "scale" }, { id: "rotate" }, { id: "bounce-y" },
];

function TemplatePreview({ fn, color, template, duration, th, customImg }: {
  fn: (t: number) => number; color: string; template: string; duration: number; th: Theme; customImg?: string | null;
}) {
  const [t, setT] = useState(0);
  useAnimLoop(duration, setT);
  let v = 0; try { v = fn(t); } catch { }

  const CardFace = ({ style }: { style?: React.CSSProperties }) => (
    customImg ? (
      <div style={{
        width: 56, height: 72, borderRadius: 8, overflow: "hidden",
        border: `2px solid ${color}44`, boxShadow: `0 0 12px ${color}33`, flexShrink: 0,
        ...style
      }}>
        <img src={customImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      </div>
    ) : (
      <div style={{
        width: 56, height: 72,
        background: `linear-gradient(135deg, ${th.canvasAxis} 0%, ${th.panel} 100%)`,
        borderRadius: 8, border: `2px solid ${color}44`, boxShadow: `0 0 12px ${color}33`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, flexShrink: 0,
        ...style
      }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: color, opacity: 0.9, boxShadow: `0 0 8px ${color}` }} />
        <div style={{ width: 32, height: 3, borderRadius: 2, background: color, opacity: 0.5 }} />
        <div style={{ width: 22, height: 3, borderRadius: 2, background: color, opacity: 0.3 }} />
      </div>
    )
  );

  const trackW = 156;
  let inner: React.ReactNode = null;

  if (template === "slide") {
    const x = v * (trackW - 60);
    inner = (
      <div style={{ position: "relative", width: trackW, height: 80, display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: th.border, borderRadius: 1, top: "50%" }} />
        <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 2, height: 24, background: th.canvasAxis }} />
        <div style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: 2, height: 24, background: th.canvasAxis }} />
        <div style={{ position: "absolute", left: x, top: "50%", transform: "translateY(-50%)" }}><CardFace /></div>
      </div>
    );
  } else if (template === "fade") {
    inner = (
      <div style={{ position: "relative", width: trackW, height: 80, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 11, color: th.textSub, position: "absolute", left: 12 }}>0%</div>
        <div style={{ fontSize: 11, color: th.textSub, position: "absolute", right: 12 }}>100%</div>
        <CardFace style={{ opacity: v }} />
      </div>
    );
  } else if (template === "scale") {
    const s = 0.2 + v * 0.8;
    inner = (
      <div style={{ width: trackW, height: 90, display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
        <div style={{ fontSize: 11, color: th.textSub, textAlign: "center" }}>
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
        <div style={{ fontSize: 11, color: th.textSub, textAlign: "center" }}>
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
        <div style={{ position: "absolute", bottom: 8, left: 20, right: 20, height: 2, background: th.canvasAxis, borderRadius: 1 }} />
        <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", width: 30 + v * 30, height: 6, borderRadius: "50%", background: color, opacity: 0.1 + v * 0.2, filter: "blur(4px)" }} />
        <div style={{ transform: `translateY(${y}px)`, marginBottom: 10 }}><CardFace /></div>
      </div>
    );
  }

  return (
    <div style={{ background: th.panel, borderRadius: 10, padding: "10px 14px", border: `1px solid ${th.border}`, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: 11, color: th.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>{template}</div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 100 }}>{inner}</div>
    </div>
  );
}

function TrailPreview({ fn, color, duration, th }: { fn: (t: number) => number; color: string; duration: number; th: Theme }) {
  const [t, setT] = useState(0);
  useAnimLoop(duration, setT);
  let v = 0; try { v = fn(t); } catch { }
  const trackW = 156;
  const x = 4 + v * (trackW - 16);
  const ghosts = [0.95, 0.9, 0.82, 0.72, 0.6].map(offset => {
    const gt = Math.max(0, t - (1 - offset) * 0.15);
    let gv = 0; try { gv = fn(gt); } catch { }
    return 4 + gv * (trackW - 16);
  });
  return (
    <div style={{ background: th.panel, borderRadius: 10, padding: "10px 14px", border: `1px solid ${th.border}` }}>
      <div style={{ fontSize: 11, color: th.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Trail</div>
      <div style={{ position: "relative", height: 32, display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: th.border, borderRadius: 1, top: "50%" }} />
        {ghosts.map((gx, i) => (
          <div key={i} style={{ position: "absolute", left: gx, top: "50%", transform: "translate(-50%, -50%)", width: 10 - i, height: 10 - i, borderRadius: "50%", background: color, opacity: 0.08 + (ghosts.length - i) * 0.04 }} />
        ))}
        <div style={{ position: "absolute", left: x, top: "50%", transform: "translate(-50%, -50%)", width: 14, height: 14, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}` }} />
      </div>
    </div>
  );
}

// ── Node Editor ───────────────────────────────────────────────────────────────

const SINGLE_ARG_MODES: CombineMode[] = ["yoyo", "clamp", "repeat", "zigzag"];

function NodeEditor({ node, onChange, th, allNames, selectStyle, path, dragCtx }: {
  node: TweenNode;
  onChange: (n: TweenNode) => void;
  th: Theme;
  allNames: string[];
  selectStyle: React.CSSProperties;
  path: string[];
  dragCtx: DragCtx;
}) {
  const [over, setOver] = useState(false);

  const isSource = !!dragCtx.dragging && dragCtx.dragging.join(",") === path.join(",");
  const canDrop = !!dragCtx.dragging && !isSource
    && !isAncestorOrSame(dragCtx.dragging, path)
    && !isAncestorOrSame(path, dragCtx.dragging);

  const dropProps = canDrop ? {
    onDragEnter: (e: React.DragEvent) => { e.preventDefault(); setOver(true); },
    onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false); },
    onDragOver: (e: React.DragEvent) => { e.preventDefault(); },
    onDrop: (e: React.DragEvent) => { e.stopPropagation(); dragCtx.swap(dragCtx.dragging!, path); dragCtx.setDragging(null); setOver(false); },
  } : {};

  const btnStyle: React.CSSProperties = {
    background: "transparent", border: `1px solid ${th.border}`, borderRadius: 4,
    padding: "2px 8px", cursor: "pointer", fontSize: 14, color: th.textSub, lineHeight: 1,
    flexShrink: 0,
  };

  // Drag handle — only for non-root nodes
  const handle = path.length > 0 ? (
    <span
      draggable
      onDragStart={e => { e.stopPropagation(); dragCtx.setDragging(path); }}
      onDragEnd={() => { dragCtx.setDragging(null); setOver(false); }}
      title="Drag to swap"
      style={{ cursor: "grab", color: th.textMuted, userSelect: "none", fontSize: 13, lineHeight: 1, opacity: 0.5, flexShrink: 0 }}
    >⠿</span>
  ) : null;

  const rowStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
    borderRadius: 6, padding: "2px 0",
    outline: over ? `2px solid #f59e0b` : "none",
    opacity: isSource ? 0.35 : 1,
    transition: "outline 0.1s, opacity 0.1s",
  };

  if (node.type === "simple") {
    return (
      <div {...dropProps} style={rowStyle}>
        {handle}
        <select value={node.name} onChange={e => onChange({ type: "simple", name: e.target.value })} style={selectStyle}>
          {allNames.map(n => <option key={n}>{n}</option>)}
        </select>
        <button title="Wrap in operation" style={btnStyle}
          onClick={() => onChange({ type: "op", mode: "composite", a: node, b: { type: "simple", name: "linear" }, mix: 0.5, repeatCount: 3, clampMin: 0.15, clampMax: 0.85 })}>
          +
        </button>
      </div>
    );
  }

  const showB = !SINGLE_ARG_MODES.includes(node.mode);

  return (
    <div style={{ opacity: isSource ? 0.35 : 1, transition: "opacity 0.1s" }}>
      <div {...dropProps} style={{ ...rowStyle, marginBottom: 6, opacity: 1 }}>
        {handle}
        <select value={node.mode}
          onChange={e => onChange({ ...node, mode: e.target.value as CombineMode })}
          style={{ ...selectStyle, color: "#f59e0b" }}>
          {combineModes.filter(m => m.id !== "none").map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
        {(node.mode === "lerp" || node.mode === "average") && (
          <>
            <span style={{ fontSize: 11, color: th.textMuted }}>Mix: {node.mix.toFixed(2)}</span>
            <input type="range" min={0} max={1} step={0.01} value={node.mix}
              onChange={e => onChange({ ...node, mix: parseFloat(e.target.value) })}
              style={{ width: 80, accentColor: "#f59e0b" }} />
          </>
        )}
        {(node.mode === "repeat" || node.mode === "zigzag") && (
          <>
            <span style={{ fontSize: 11, color: th.textMuted }}>×{node.repeatCount}</span>
            <input type="range" min={1} max={12} step={1} value={node.repeatCount}
              onChange={e => onChange({ ...node, repeatCount: parseInt(e.target.value) })}
              style={{ width: 60, accentColor: "#f59e0b" }} />
          </>
        )}
        {node.mode === "clamp" && (
          <>
            <span style={{ fontSize: 11, color: th.textMuted }}>[{node.clampMin.toFixed(2)}, {node.clampMax.toFixed(2)}]</span>
            <input type="range" min={0} max={1} step={0.01} value={node.clampMin}
              onChange={e => onChange({ ...node, clampMin: parseFloat(e.target.value) })}
              style={{ width: 60, accentColor: "#f59e0b" }} />
            <input type="range" min={0} max={1} step={0.01} value={node.clampMax}
              onChange={e => onChange({ ...node, clampMax: parseFloat(e.target.value) })}
              style={{ width: 60, accentColor: "#f59e0b" }} />
          </>
        )}
        <button title="Collapse (keep A)" style={btnStyle} onClick={() => onChange(node.a)}>−</button>
      </div>
      <div style={{ borderLeft: `2px solid ${th.border}`, paddingLeft: 10, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
          <span style={{ fontSize: 10, color: th.textMuted, minWidth: 12, paddingTop: 9 }}>A</span>
          <NodeEditor node={node.a} onChange={a => onChange({ ...node, a })} th={th} allNames={allNames} selectStyle={selectStyle} path={[...path, "a"]} dragCtx={dragCtx} />
        </div>
        {showB && (
          <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
            <span style={{ fontSize: 10, color: th.textMuted, minWidth: 12, paddingTop: 9 }}>B</span>
            <NodeEditor node={node.b} onChange={b => onChange({ ...node, b })} th={th} allNames={allNames} selectStyle={selectStyle} path={[...path, "b"]} dragCtx={dragCtx} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const th = isDark ? darkTheme : lightTheme;

  const [customImg, setCustomImg] = useState<string | null>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const handleImgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (customImg) URL.revokeObjectURL(customImg);
    setCustomImg(URL.createObjectURL(file));
    e.target.value = "";
  };

  const [rootNode, setRootNode] = useState<TweenNode>({ type: "simple", name: "easeInOutCubic" });
  const [cp, setCp] = useState([0.25, 0.1, 0.25, 1.0]);
  const [tab, setTab] = useState<"library" | "bezier">("library");
  const [duration, setDuration] = useState(1.8);
  const [draggingPath, setDraggingPath] = useState<string[] | null>(null);
  const dragCtx: DragCtx = {
    dragging: draggingPath,
    setDragging: setDraggingPath,
    swap: (pathA, pathB) => setRootNode(root => {
      const a = getNodeAtPath(root, pathA);
      const b = getNodeAtPath(root, pathB);
      return setNodeAtPath(setNodeAtPath(root, pathA, b), pathB, a);
    }),
  };

  const customFn = useMemo(() => cubicBezier(cp[0], cp[1], cp[2], cp[3]), [cp]);
  const finalFn = useMemo(() => evalNode(rootNode, customFn), [rootNode, customFn]);
  const selectedName = rootNode.type === "simple" ? rootNode.name : null;
  const activeColor = rootNode.type === "op" ? "#f59e0b" : getColor(selectedName ?? "linear");

  const allNames = [...Object.values(categories).flat(), "linear", "customCubicBezier"];

  const selectStyle: React.CSSProperties = {
    background: th.inputBg, color: th.text, border: `1px solid ${th.border}`,
    borderRadius: 6, padding: "6px 8px", fontSize: 12, cursor: "pointer",
  };

  const panel = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: th.panel, border: `1px solid ${th.border}`, borderRadius: 12, ...extra,
  });

  return (
    <div style={{ minHeight: "100vh", background: th.bg, color: th.text, fontFamily: "'Inter', sans-serif", padding: "16px", transition: "background 0.2s, color 0.2s" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, background: "linear-gradient(90deg, #818cf8, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              ✦ Easing Editor
            </h1>
            <p style={{ margin: "6px 0 0", color: th.textMuted, fontSize: 14 }}>Visualize & customize animation easing curves</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Image upload */}
            <input ref={imgInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImgUpload} />
            <button onClick={() => imgInputRef.current?.click()} title="Upload custom preview image" style={{
              background: customImg ? "#34d39922" : th.panel, border: `1px solid ${customImg ? "#34d399" : th.border}`,
              borderRadius: 10, padding: "8px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600,
              color: customImg ? "#34d399" : th.textSub, display: "flex", alignItems: "center", gap: 6,
            }}>
              🖼 {customImg ? "Change image" : "Upload image"}
            </button>
            {customImg && (
              <button onClick={() => { URL.revokeObjectURL(customImg); setCustomImg(null); }} title="Remove custom image" style={{
                background: th.panel, border: `1px solid ${th.border}`, borderRadius: 10,
                padding: "8px 10px", cursor: "pointer", fontSize: 13, color: th.textSub,
              }}>✕</button>
            )}
            {/* Theme toggle */}
            <button onClick={() => setIsDark(v => !v)} title={isDark ? "Switch to light mode" : "Switch to dark mode"} style={{
              background: th.panel, border: `1px solid ${th.border}`, borderRadius: 10,
              padding: "10px 14px", cursor: "pointer", fontSize: 18, lineHeight: 1,
              color: th.text, transition: "background 0.2s",
            }}>
              {isDark ? "☀️" : "🌙"}
            </button>
            {/* Duration slider */}
            <div style={{ ...panel(), padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: th.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Duration</span>
              <input
                type="range" min={0.1} max={2.0} step={0.1} value={duration}
                onChange={e => setDuration(parseFloat(e.target.value))}
                style={{ width: 120, accentColor: "#34d399" }}
              />
              <span style={{ color: "#34d399", fontFamily: "monospace", fontSize: 13, minWidth: 32 }}>{duration.toFixed(1)}s</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {(["library", "bezier"] as const).map(id => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: tab === id ? "#818cf8" : th.panel,
              color: tab === id ? "#fff" : th.textSub,
              border: `1px solid ${tab === id ? "transparent" : th.border}`,
              transition: "all 0.2s",
            } as React.CSSProperties}>
              {id === "library" ? "📚 Library" : "🎛 Bézier"}
            </button>
          ))}
        </div>

        {/* Tween Tree panel */}
        <div style={{ ...panel(), padding: "10px 12px", marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: th.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Tween Tree</div>
          <NodeEditor node={rootNode} onChange={setRootNode} th={th} allNames={allNames} selectStyle={selectStyle} path={[]} dragCtx={dragCtx} />
        </div>

        {/* Library Tab */}
        {tab === "library" && (
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {/* Sidebar */}
            <div style={{ flex: "0 0 200px" }}>
              <div style={{ ...panel(), padding: 12 }}>
                <div style={{ fontSize: 11, color: th.textMuted, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Easing Types</div>
                {Object.entries(categories).map(([cat, names]) => (
                  <div key={cat} style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, color: th.textMuted, marginBottom: 3, fontWeight: 600 }}>{cat}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {names.map(n => {
                        const col = getColor(n);
                        const isActive = selectedName === n;
                        return (
                          <button key={n} onClick={() => setRootNode({ type: "simple", name: n })} style={{
                            padding: "4px 8px", borderRadius: 5,
                            border: `1px solid ${isActive ? col : "transparent"}`,
                            background: isActive ? col + "22" : "transparent",
                            color: isActive ? col : th.textSub,
                            cursor: "pointer", fontSize: 11, textAlign: "left", fontFamily: "monospace",
                          }}>{n}</button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${th.border}`, marginTop: 8, paddingTop: 8 }}>
                  <button onClick={() => setRootNode({ type: "simple", name: "linear" })} style={{
                    padding: "4px 8px", borderRadius: 5,
                    border: `1px solid ${selectedName === "linear" ? "#6b7280" : "transparent"}`,
                    background: selectedName === "linear" ? "#6b728022" : "transparent",
                    color: selectedName === "linear" ? "#6b7280" : th.textSub,
                    cursor: "pointer", fontSize: 11, fontFamily: "monospace", width: "100%", textAlign: "left",
                  }}>linear</button>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
                <div style={{ ...panel(), padding: 12 }}>
                  <div style={{ fontSize: 11, color: th.textMuted, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Curve</div>
                  <EasingCurve fn={finalFn} color={activeColor} animated duration={duration} th={th} />
                </div>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ fontSize: 11, color: th.textMuted, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                    Template Previews
                    <span style={{ marginLeft: 8, color: activeColor, fontFamily: "monospace", textTransform: "none", fontSize: 11 }}>{selectedName ?? "complex"}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {templates.map(({ id }) => (
                      <TemplatePreview key={id} fn={finalFn} color={activeColor} template={id} duration={duration} th={th} customImg={customImg} />
                    ))}
                    <TrailPreview fn={finalFn} color={activeColor} duration={duration} th={th} />
                  </div>
                </div>
              </div>

              {/* Mini grid */}
              <div style={{ ...panel(), padding: 14 }}>
                <div style={{ fontSize: 11, color: th.textMuted, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>All Curves</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: 6 }}>
                  {[...Object.values(categories).flat(), "linear"].map(n => (
                    <div key={n} onClick={() => setRootNode({ type: "simple", name: n })} style={{
                      cursor: "pointer", borderRadius: 6,
                      border: `1px solid ${selectedName === n ? getColor(n) : th.border}`,
                      overflow: "hidden",
                      background: selectedName === n ? getColor(n) + "11" : th.bg,
                      transition: "border-color 0.15s",
                    }}>
                      <EasingCurve fn={easings[n] ?? (t => t)} color={getColor(n)} width={72} height={72} th={th} />
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
              <div style={{ ...panel(), padding: 12 }}>
                <div style={{ fontSize: 11, color: th.textMuted, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Drag control points</div>
                <BezierEditor cp={cp} onChange={v => { setCp(v); setRootNode({ type: "simple", name: "customCubicBezier" }); }} th={th} />
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ ...panel(), padding: 16, marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: th.textMuted, fontWeight: 600, marginBottom: 12, textTransform: "uppercase", letterSpacing: 1 }}>Parameters</div>
                {([["P1 X", 0], ["P1 Y", 1], ["P2 X", 2], ["P2 Y", 3]] as [string, number][]).map(([label, i]) => (
                  <div key={label} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: th.textSub, fontFamily: "monospace" }}>{label}</span>
                      <span style={{ color: "#34d399", fontFamily: "monospace" }}>{cp[i].toFixed(3)}</span>
                    </div>
                    <input type="range" min={i % 2 === 0 ? 0 : -2} max={i % 2 === 0 ? 1 : 3} step={0.001} value={cp[i]}
                      onChange={e => { const n = [...cp]; n[i] = parseFloat(e.target.value); setCp(n); setRootNode({ type: "simple", name: "customCubicBezier" }); }}
                      style={{ width: "100%", accentColor: "#34d399" }} />
                  </div>
                ))}
                <div style={{ marginTop: 12, padding: "10px 12px", background: th.bg, borderRadius: 6, fontFamily: "monospace", fontSize: 12, color: th.textSub }}>
                  <span style={{ color: "#818cf8" }}>cubic-bezier</span>(<span style={{ color: "#34d399" }}>{cp.map(v => v.toFixed(3)).join(", ")}</span>)
                </div>
              </div>
              <div style={{ fontSize: 11, color: th.textMuted, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Template Previews</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {templates.map(({ id }) => (
                  <TemplatePreview key={id} fn={customFn} color="#34d399" template={id} duration={duration} th={th} customImg={customImg} />
                ))}
                <TrailPreview fn={customFn} color="#34d399" duration={duration} th={th} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

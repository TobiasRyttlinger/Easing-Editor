export const W = 320;
export const H = 320;
export const PAD = 40;
export const IW = W - PAD * 2;

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export type Theme = {
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

export const darkTheme: Theme = {
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

export const lightTheme: Theme = {
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

function easeOutBounce(t: number) {
  const n1 = 7.5625, d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}

export const easings: Record<string, (t: number) => number> = {
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

export function cubicBezier(p1x: number, p1y: number, p2x: number, p2y: number) {
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

export type CombineMode = "none" | "yoyo" | "composite" | "multiply" | "connect" | "average" | "lerp" | "clamp" | "repeat" | "zigzag" | "crossfade";

export const combineModes: { id: CombineMode; label: string }[] = [
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

export type TweenNode =
  | { type: "simple"; name: string }
  | { type: "op"; mode: CombineMode; a: TweenNode; b: TweenNode;
      mix: number; repeatCount: number; clampMin: number; clampMax: number; connectX: number; connectY: number };

export type CurveTrack = { id: string; label: string; node: TweenNode };
export type TreePreset = { id: string; label: string; tracks: CurveTrack[] };

export type DragCtx = {
  dragging: string[] | null;
  setDragging: (p: string[] | null) => void;
  swap: (a: string[], b: string[]) => void;
};

export function makeCombined(
  mode: CombineMode,
  aFn: (t: number) => number,
  bFn: (t: number) => number,
  mix: number, repeatCount: number, minV: number, maxV: number, connectX: number, connectY: number,
) {
  const m = clamp01(mix);
  const count = Math.max(1, Math.floor(repeatCount));
  const lo = Math.min(minV, maxV), hi = Math.max(minV, maxV);
  const cx = clamp01(connectX), cy = clamp01(connectY);
  return (tRaw: number): number => {
    const t = clamp01(tRaw);
    const a = aFn(t), b = bFn(t);
    switch (mode) {
      case "yoyo": { const p = t < 0.5 ? t * 2 : (1 - t) * 2; return aFn(p); }
      case "composite": return aFn(clamp01(b));
      case "multiply": return a * b;
      case "connect": {
        if (t <= cx) {
          const u = cx <= 1e-6 ? 1 : t / cx;
          return cy * aFn(u);
        }
        const u = (1 - cx) <= 1e-6 ? 1 : (t - cx) / (1 - cx);
        return cy + (1 - cy) * bFn(u);
      }
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

export function evalNode(node: TweenNode, customFn: (t: number) => number): (t: number) => number {
  if (node.type === "simple")
    return node.name === "customCubicBezier" ? customFn : (easings[node.name] ?? easings.linear);
  const aFn = evalNode(node.a, customFn);
  const bFn = evalNode(node.b, customFn);
  return makeCombined(node.mode, aFn, bFn, node.mix, node.repeatCount, node.clampMin, node.clampMax, node.connectX, node.connectY);
}

export function getNodeAtPath(root: TweenNode, path: string[]): TweenNode {
  if (path.length === 0) return root;
  if (root.type !== "op") return root;
  const [h, ...rest] = path;
  return getNodeAtPath(h === "a" ? root.a : root.b, rest);
}

export function setNodeAtPath(root: TweenNode, path: string[], value: TweenNode): TweenNode {
  if (path.length === 0) return value;
  if (root.type !== "op") return root;
  const [h, ...rest] = path;
  return h === "a"
    ? { ...root, a: setNodeAtPath(root.a, rest, value) }
    : { ...root, b: setNodeAtPath(root.b, rest, value) };
}

export function isAncestorOrSame(anc: string[], desc: string[]): boolean {
  return anc.length <= desc.length && anc.every((v, i) => desc[i] === v);
}

export const categories: Record<string, string[]> = {
  Sine: ["easeInSine", "easeOutSine", "easeInOutSine"],
  Quad: ["easeInQuad", "easeOutQuad", "easeInOutQuad"],
  Cubic: ["easeInCubic", "easeOutCubic", "easeInOutCubic"],
  Quart: ["easeInQuart", "easeOutQuart", "easeInOutQuart"],
  Expo: ["easeInExpo", "easeOutExpo", "easeInOutExpo"],
  Circ: ["easeInCirc", "easeOutCirc", "easeInOutCirc"],
  Back: ["easeInBack", "easeOutBack", "easeInOutBack"],
  Elastic: ["easeInElastic", "easeOutElastic", "easeInOutElastic"],
  Bounce: ["easeInBounce", "easeOutBounce", "easeInOutBounce"],
};

export function getColor(name: string) {
  if (name === "customCubicBezier") return "#34d399";
  if (name.startsWith("easeInOut")) return "#a78bfa";
  if (name.startsWith("easeIn")) return "#f97316";
  if (name.startsWith("easeOut")) return "#22d3ee";
  return "#6b7280";
}

export const SINGLE_ARG_MODES: CombineMode[] = ["yoyo", "clamp", "repeat", "zigzag"];

export const nodeSimple = (name: string): TweenNode => ({ type: "simple", name });
export const nodeOp = (
  mode: CombineMode,
  a: TweenNode,
  b: TweenNode = nodeSimple("linear"),
  opts: Partial<Pick<Extract<TweenNode, { type: "op" }>, "mix" | "repeatCount" | "clampMin" | "clampMax" | "connectX" | "connectY">> = {},
): TweenNode => ({
  type: "op",
  mode,
  a,
  b,
  mix: opts.mix ?? 0.5,
  repeatCount: opts.repeatCount ?? 3,
  clampMin: opts.clampMin ?? 0.15,
  clampMax: opts.clampMax ?? 0.85,
  connectX: opts.connectX ?? 0.5,
  connectY: opts.connectY ?? 0.5,
});

export const cloneNode = (node: TweenNode): TweenNode => {
  if (node.type === "simple") return { ...node };
  return { ...node, a: cloneNode(node.a), b: cloneNode(node.b) };
};

const track = (id: string, label: string, node: TweenNode): CurveTrack => ({ id, label, node });
const presetId = (key: string) => `tfx_${key.toLowerCase()}`;
const singlePreset = (key: string, label: string, node: TweenNode): TreePreset => ({
  id: presetId(key),
  label,
  tracks: [track("main", "Main", node)],
});

const tweenFxAnimations: { key: string; label: string }[] = [
  { key: "POP_IN", label: "Pop In" }, { key: "POP_OUT", label: "Pop Out" },
  { key: "PUNCH_IN", label: "Punch In" }, { key: "PUNCH_OUT", label: "Punch Out" },
  { key: "FADE_IN", label: "Fade In" }, { key: "FADE_OUT", label: "Fade Out" },
  { key: "DROP_IN", label: "Drop In" }, { key: "DROP_OUT", label: "Drop Out" },
  { key: "JUMP_SCARE", label: "Jump Scare" }, { key: "SPIN", label: "Spin" },
  { key: "SKEW", label: "Skew" }, { key: "VANISH", label: "Vanish" },
  { key: "SHAKE", label: "Shake" }, { key: "PULSATE", label: "Pulsate" },
  { key: "JITTER", label: "Jitter" }, { key: "JELLY", label: "Jelly" },
  { key: "FLIP", label: "Flip" }, { key: "HOP", label: "Hop" },
  { key: "BLINK", label: "Blink" }, { key: "SQUASH", label: "Squash" },
  { key: "STRETCH", label: "Stretch" }, { key: "SNAP", label: "Snap" },
  { key: "COLOR_CYCLE", label: "Color Cycle" }, { key: "HEARTBEAT", label: "Heartbeat" },
  { key: "SWING", label: "Swing" }, { key: "CHARGE_UP", label: "Charge Up" },
  { key: "RICOCHET", label: "Ricochet" }, { key: "GLITCH", label: "Glitch" },
  { key: "SPOTLIGHT", label: "Spotlight" }, { key: "WAVE_DISTORT", label: "Wave Distort" },
  { key: "WIGGLE", label: "Wiggle" }, { key: "FLOAT_BOB", label: "Float Bob" },
  { key: "GLOW_PULSE", label: "Glow Pulse" }, { key: "TWIST", label: "Twist" },
  { key: "ROTATE_HOP", label: "Rotate Hop" }, { key: "EXPLODE", label: "Explode" },
  { key: "BLACK_HOLE", label: "Black Hole" }, { key: "MELT", label: "Melt" },
  { key: "TV_SHUTDOWN", label: "TV Shutdown" }, { key: "MAD_HELICO", label: "Mad Helico" },
  { key: "SPIN_BOUNCE", label: "Spin Bounce" }, { key: "IDLE_RUBBER", label: "Idle Rubber" },
  { key: "BUBBLE_ASCEND", label: "Bubble Ascend" }, { key: "CREEP_OUT", label: "Creep Out" },
  { key: "RUBBER_BAND", label: "Rubber Band" }, { key: "FIDGET", label: "Fidget" },
  { key: "DEFLATE", label: "Deflate" }, { key: "DRUNK", label: "Drunk" },
  { key: "IMPACT_LAND", label: "Impact Land" }, { key: "BREATHE", label: "Breathe" },
  { key: "SWAY", label: "Sway" }, { key: "FLICKER", label: "Flicker" },
  { key: "CRITICAL_HIT", label: "Critical Hit" }, { key: "UPGRADE", label: "Upgrade" },
  { key: "FOLD_IN", label: "Fold In" }, { key: "FOLD_OUT", label: "Fold Out" },
  { key: "ALARM", label: "Alarm" }, { key: "POINT", label: "Point" },
  { key: "TADA", label: "Tada" }, { key: "GHOST", label: "Ghost" },
  { key: "ATTRACT", label: "Attract" }, { key: "ORBIT", label: "Orbit" },
  { key: "PRESS", label: "Press" }, { key: "PRESS_ROTATE", label: "Press Rotate" },
  { key: "MAGNETIC_PULL", label: "Magnetic Pull" }, { key: "HEADSHAKE", label: "Headshake" },
];

const presetOverrides: Record<string, TreePreset> = {
  POP_IN: singlePreset("POP_IN", "Pop In", nodeSimple("easeOutBack")),
  POP_OUT: singlePreset("POP_OUT", "Pop Out", nodeSimple("easeInBack")),
  PUNCH_IN: singlePreset("PUNCH_IN", "Punch In", nodeOp("connect", nodeSimple("easeOutBack"), nodeSimple("easeOutQuad"))),
  PUNCH_OUT: singlePreset("PUNCH_OUT", "Punch Out", nodeOp("connect", nodeSimple("easeOutQuad"), nodeSimple("easeInBack"))),
  FADE_IN: singlePreset("FADE_IN", "Fade In", nodeSimple("linear")),
  FADE_OUT: singlePreset("FADE_OUT", "Fade Out", nodeSimple("linear")),
  DROP_IN: singlePreset("DROP_IN", "Drop In", nodeSimple("easeOutBounce")),
  DROP_OUT: singlePreset("DROP_OUT", "Drop Out", nodeSimple("easeInBack")),
  JUMP_SCARE: { id: presetId("JUMP_SCARE"), label: "Jump Scare", tracks: [track("scale", "Scale", nodeSimple("easeOutBack")), track("alpha", "Alpha", nodeSimple("easeOutExpo"))] },
  SPIN: singlePreset("SPIN", "Spin", nodeSimple("linear")),
  SKEW: singlePreset("SKEW", "Skew", nodeOp("connect", nodeSimple("easeOutQuad"), nodeSimple("easeInOutSine"))),
  VANISH: singlePreset("VANISH", "Vanish", nodeSimple("easeInExpo")),
  SHAKE: singlePreset("SHAKE", "Shake", nodeOp("zigzag", nodeSimple("easeInOutSine"), nodeSimple("linear"), { repeatCount: 8 })),
  PULSATE: singlePreset("PULSATE", "Pulsate", nodeOp("yoyo", nodeSimple("easeOutSine"))),
  JITTER: singlePreset("JITTER", "Jitter", nodeOp("zigzag", nodeSimple("easeOutQuad"), nodeSimple("linear"), { repeatCount: 10 })),
  JELLY: singlePreset("JELLY", "Jelly", nodeOp("yoyo", nodeSimple("easeOutElastic"))),
  FLIP: singlePreset("FLIP", "Flip", nodeSimple("easeInOutSine")),
  HOP: singlePreset("HOP", "Hop", nodeOp("yoyo", nodeSimple("easeOutSine"))),
  BLINK: singlePreset("BLINK", "Blink", nodeOp("repeat", nodeSimple("easeOutQuad"), nodeSimple("linear"), { repeatCount: 6 })),
  SQUASH: singlePreset("SQUASH", "Squash", nodeSimple("easeOutBack")),
  STRETCH: singlePreset("STRETCH", "Stretch", nodeSimple("easeOutElastic")),
  SNAP: singlePreset("SNAP", "Snap", nodeOp("connect", nodeSimple("easeOutExpo"), nodeSimple("easeInOutBack"))),
  COLOR_CYCLE: {
    id: presetId("COLOR_CYCLE"),
    label: "Color Cycle",
    tracks: [
      track("r", "R", nodeOp("zigzag", nodeSimple("easeInOutSine"), nodeSimple("linear"), { repeatCount: 3 })),
      track("g", "G", nodeOp("zigzag", nodeSimple("easeInOutSine"), nodeSimple("linear"), { repeatCount: 4 })),
      track("b", "B", nodeOp("zigzag", nodeSimple("easeInOutSine"), nodeSimple("linear"), { repeatCount: 5 })),
    ],
  },
  HEARTBEAT: singlePreset("HEARTBEAT", "Heartbeat", nodeOp("connect", nodeOp("zigzag", nodeSimple("easeOutCubic"), nodeSimple("linear"), { repeatCount: 4 }), nodeSimple("easeOutQuad"))),
  SWING: singlePreset("SWING", "Swing", nodeOp("zigzag", nodeSimple("easeInOutSine"), nodeSimple("linear"), { repeatCount: 3 })),
  CHARGE_UP: singlePreset("CHARGE_UP", "Charge Up", nodeOp("connect", nodeSimple("easeInExpo"), nodeSimple("easeOutCubic"))),
  RICOCHET: singlePreset("RICOCHET", "Ricochet", nodeSimple("easeOutBounce")),
  GLITCH: {
    id: presetId("GLITCH"),
    label: "Glitch",
    tracks: [
      track("x", "X", nodeOp("zigzag", nodeSimple("easeOutQuad"), nodeSimple("linear"), { repeatCount: 12 })),
      track("y", "Y", nodeOp("zigzag", nodeSimple("easeOutQuad"), nodeSimple("linear"), { repeatCount: 9 })),
      track("alpha", "Alpha", nodeOp("repeat", nodeSimple("easeOutQuad"), nodeSimple("linear"), { repeatCount: 8 })),
    ],
  },
  SPOTLIGHT: { id: presetId("SPOTLIGHT"), label: "Spotlight", tracks: [track("alpha", "Alpha", nodeSimple("easeInOutSine")), track("scale", "Scale", nodeSimple("easeInOutQuad"))] },
  WAVE_DISTORT: { id: presetId("WAVE_DISTORT"), label: "Wave Distort", tracks: [track("x", "X", nodeOp("zigzag", nodeSimple("easeInOutSine"), nodeSimple("linear"), { repeatCount: 6 })), track("y", "Y", nodeOp("zigzag", nodeSimple("easeInOutSine"), nodeSimple("linear"), { repeatCount: 3 }))] },
  WIGGLE: singlePreset("WIGGLE", "Wiggle", nodeOp("zigzag", nodeSimple("easeInOutSine"), nodeSimple("linear"), { repeatCount: 7 })),
  FLOAT_BOB: singlePreset("FLOAT_BOB", "Float Bob", nodeOp("yoyo", nodeSimple("easeInOutSine"))),
  GLOW_PULSE: singlePreset("GLOW_PULSE", "Glow Pulse", nodeOp("yoyo", nodeSimple("easeInOutSine"))),
  TWIST: singlePreset("TWIST", "Twist", nodeOp("zigzag", nodeSimple("easeInOutCubic"), nodeSimple("linear"), { repeatCount: 5 })),
  ROTATE_HOP: { id: presetId("ROTATE_HOP"), label: "Rotate Hop", tracks: [track("rot", "Rotation", nodeSimple("linear")), track("height", "Hop Height", nodeOp("yoyo", nodeSimple("easeOutSine")))] },
  EXPLODE: singlePreset("EXPLODE", "Explode", nodeSimple("easeOutExpo")),
  BLACK_HOLE: singlePreset("BLACK_HOLE", "Black Hole", nodeSimple("easeInExpo")),
  MELT: singlePreset("MELT", "Melt", nodeSimple("easeInQuad")),
  TV_SHUTDOWN: { id: presetId("TV_SHUTDOWN"), label: "TV Shutdown", tracks: [track("y", "Y Scale", nodeSimple("easeInExpo")), track("alpha", "Alpha", nodeSimple("easeInQuad"))] },
  MAD_HELICO: singlePreset("MAD_HELICO", "Mad Helico", nodeOp("repeat", nodeSimple("easeOutCubic"), nodeSimple("linear"), { repeatCount: 6 })),
  SPIN_BOUNCE: { id: presetId("SPIN_BOUNCE"), label: "Spin Bounce", tracks: [track("rot", "Rotation", nodeSimple("linear")), track("height", "Bounce", nodeSimple("easeOutBounce"))] },
  IDLE_RUBBER: singlePreset("IDLE_RUBBER", "Idle Rubber", nodeOp("yoyo", nodeSimple("easeOutBack"))),
  BUBBLE_ASCEND: singlePreset("BUBBLE_ASCEND", "Bubble Ascend", nodeSimple("easeOutSine")),
  CREEP_OUT: singlePreset("CREEP_OUT", "Creep Out", nodeSimple("easeInExpo")),
  RUBBER_BAND: singlePreset("RUBBER_BAND", "Rubber Band", nodeOp("connect", nodeOp("yoyo", nodeSimple("easeOutBack")), nodeSimple("easeOutElastic"))),
  FIDGET: singlePreset("FIDGET", "Fidget", nodeOp("zigzag", nodeSimple("easeInOutSine"), nodeSimple("linear"), { repeatCount: 9 })),
  DEFLATE: singlePreset("DEFLATE", "Deflate", nodeSimple("easeInBack")),
  DRUNK: singlePreset("DRUNK", "Drunk", nodeOp("zigzag", nodeSimple("easeInOutSine"), nodeSimple("linear"), { repeatCount: 5 })),
  IMPACT_LAND: singlePreset("IMPACT_LAND", "Impact Land", nodeOp("connect", nodeSimple("easeOutExpo"), nodeSimple("easeOutBounce"))),
  BREATHE: singlePreset("BREATHE", "Breathe", nodeOp("yoyo", nodeSimple("easeInOutSine"))),
  SWAY: singlePreset("SWAY", "Sway", nodeOp("zigzag", nodeSimple("easeInOutSine"), nodeSimple("linear"), { repeatCount: 3 })),
  FLICKER: singlePreset("FLICKER", "Flicker", nodeOp("repeat", nodeSimple("easeOutQuad"), nodeSimple("linear"), { repeatCount: 10 })),
  CRITICAL_HIT: singlePreset("CRITICAL_HIT", "Critical Hit", nodeOp("connect", nodeSimple("easeOutExpo"), nodeSimple("easeOutBack"))),
  UPGRADE: singlePreset("UPGRADE", "Upgrade", nodeSimple("easeOutElastic")),
  FOLD_IN: singlePreset("FOLD_IN", "Fold In", nodeSimple("easeOutCirc")),
  FOLD_OUT: singlePreset("FOLD_OUT", "Fold Out", nodeSimple("easeInCirc")),
  ALARM: singlePreset("ALARM", "Alarm", nodeOp("zigzag", nodeSimple("easeInOutSine"), nodeSimple("linear"), { repeatCount: 8 })),
  POINT: singlePreset("POINT", "Point", nodeSimple("easeOutCubic")),
  TADA: singlePreset("TADA", "Tada", nodeOp("connect", nodeOp("yoyo", nodeSimple("easeOutBack")), nodeSimple("easeOutElastic"))),
  GHOST: singlePreset("GHOST", "Ghost", nodeSimple("easeInOutSine")),
  ATTRACT: singlePreset("ATTRACT", "Attract", nodeSimple("easeInExpo")),
  ORBIT: {
    id: presetId("ORBIT"),
    label: "Orbit",
    tracks: [
      track("x", "X", nodeOp("zigzag", nodeSimple("easeInOutSine"), nodeSimple("linear"), { repeatCount: 2 })),
      track("y", "Y", nodeOp("zigzag", nodeSimple("easeInOutSine"), nodeSimple("linear"), { repeatCount: 4 })),
    ],
  },
  PRESS: singlePreset("PRESS", "Press", nodeSimple("easeInQuad")),
  PRESS_ROTATE: { id: presetId("PRESS_ROTATE"), label: "Press Rotate", tracks: [track("scale", "Scale", nodeSimple("easeInQuad")), track("rot", "Rotation", nodeSimple("easeInOutSine"))] },
  MAGNETIC_PULL: { id: presetId("MAGNETIC_PULL"), label: "Magnetic Pull", tracks: [track("position", "Position", nodeSimple("easeInExpo")), track("scale", "Scale", nodeSimple("easeOutBack"))] },
  HEADSHAKE: singlePreset("HEADSHAKE", "Headshake", nodeOp("zigzag", nodeSimple("easeInOutSine"), nodeSimple("linear"), { repeatCount: 6 })),
};

export const treePresets: TreePreset[] = tweenFxAnimations.map(({ key, label }) => (
  presetOverrides[key] ?? singlePreset(key, label, nodeSimple("easeInOutSine"))
));

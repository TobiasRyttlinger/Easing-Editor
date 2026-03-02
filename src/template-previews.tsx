import { useEffect, useRef, useState } from "react";

export type PreviewTheme = {
  bg: string;
  panel: string;
  border: string;
  textSub: string;
  textMuted: string;
  canvasAxis: string;
};

export const templates = [
  { id: "slide" }, { id: "fade" }, { id: "scale" }, { id: "rotate" }, { id: "bounce-y" },
] as const;

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

export function TemplatePreview({ fn, color, template, duration, th, customImg }: {
  fn: (t: number) => number;
  color: string;
  template: string;
  duration: number;
  th: PreviewTheme;
  customImg?: string | null;
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
          <div>{Math.round(deg)} deg</div>
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

export function TrailPreview({ fn, color, duration, th }: {
  fn: (t: number) => number;
  color: string;
  duration: number;
  th: PreviewTheme;
}) {
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

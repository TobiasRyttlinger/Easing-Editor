import { useMemo, useRef, useState, type CSSProperties } from "react";
import { templates, TemplatePreview, TrailPreview } from "../template-previews";
import {
  categories,
  cubicBezier,
  darkTheme,
  evalNode,
  getColor,
  getNodeAtPath,
  lightTheme,
  setNodeAtPath,
  type DragCtx,
  type Theme,
  type TweenNode,
} from "./core";
import { NodeEditor } from "./components/NodeEditor";
import { BezierEditor, EasingCurve } from "./components/Visuals";

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

  const selectStyle: CSSProperties = {
    background: th.inputBg, color: th.text, border: `1px solid ${th.border}`,
    borderRadius: 6, padding: "6px 8px", fontSize: 12, cursor: "pointer",
  };

  const panel = (extra?: CSSProperties): CSSProperties => ({
    background: th.panel, border: `1px solid ${th.border}`, borderRadius: 12, ...extra,
  });

  return (
    <div style={{ minHeight: "100vh", background: th.bg, color: th.text, fontFamily: "'Inter', sans-serif", padding: "16px", transition: "background 0.2s, color 0.2s" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, background: "linear-gradient(90deg, #818cf8, #34d399)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>✦ Easing Editor</h1>
            <p style={{ margin: "6px 0 0", color: th.textMuted, fontSize: 14 }}>Visualize & customize animation easing curves</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input ref={imgInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleImgUpload} />
            <button
              onClick={() => imgInputRef.current?.click()}
              title="Upload custom preview image"
              style={{
                background: customImg ? "#34d39922" : th.panel, border: `1px solid ${customImg ? "#34d399" : th.border}`,
                borderRadius: 10, padding: "8px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600,
                color: customImg ? "#34d399" : th.textSub, display: "flex", alignItems: "center", gap: 6,
              }}
            >
              🖼 {customImg ? "Change image" : "Upload image"}
            </button>
            {customImg && (
              <button
                onClick={() => { URL.revokeObjectURL(customImg); setCustomImg(null); }}
                title="Remove custom image"
                style={{
                  background: th.panel, border: `1px solid ${th.border}`, borderRadius: 10,
                  padding: "8px 10px", cursor: "pointer", fontSize: 13, color: th.textSub,
                }}
              >
                ✕
              </button>
            )}
            <button
              onClick={() => setIsDark(v => !v)}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              style={{
                background: th.panel, border: `1px solid ${th.border}`, borderRadius: 10,
                padding: "10px 14px", cursor: "pointer", fontSize: 18, lineHeight: 1,
                color: th.text, transition: "background 0.2s",
              }}
            >
              {isDark ? "☀️" : "🌙"}
            </button>
            <div style={{ ...panel(), padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: th.textMuted, fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>Duration</span>
              <input type="range" min={0.1} max={2.0} step={0.1} value={duration} onChange={e => setDuration(parseFloat(e.target.value))} style={{ width: 120, accentColor: "#34d399" }} />
              <span style={{ color: "#34d399", fontFamily: "monospace", fontSize: 13, minWidth: 32 }}>{duration.toFixed(1)}s</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          {(["library", "bezier"] as const).map(id => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
                background: tab === id ? "#818cf8" : th.panel,
                color: tab === id ? "#fff" : th.textSub,
                border: `1px solid ${tab === id ? "transparent" : th.border}`,
                transition: "all 0.2s",
              }}
            >
              {id === "library" ? "📚 Library" : "🎛 Bézier"}
            </button>
          ))}
        </div>

        <div style={{ ...panel(), padding: "10px 12px", marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: th.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Tween Tree</div>
          <NodeEditor node={rootNode} onChange={setRootNode} th={th} allNames={allNames} selectStyle={selectStyle} path={[]} dragCtx={dragCtx} />
        </div>

        {tab === "library" && (
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
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
                          <button key={n} onClick={() => setRootNode({ type: "simple", name: n })} style={{ padding: "4px 8px", borderRadius: 5, border: `1px solid ${isActive ? col : "transparent"}`, background: isActive ? col + "22" : "transparent", color: isActive ? col : th.textSub, cursor: "pointer", fontSize: 11, textAlign: "left", fontFamily: "monospace" }}>{n}</button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${th.border}`, marginTop: 8, paddingTop: 8 }}>
                  <button onClick={() => setRootNode({ type: "simple", name: "linear" })} style={{ padding: "4px 8px", borderRadius: 5, border: `1px solid ${selectedName === "linear" ? "#6b7280" : "transparent"}`, background: selectedName === "linear" ? "#6b728022" : "transparent", color: selectedName === "linear" ? "#6b7280" : th.textSub, cursor: "pointer", fontSize: 11, fontFamily: "monospace", width: "100%", textAlign: "left" }}>linear</button>
                </div>
              </div>
            </div>

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
                      <TemplatePreview key={id} fn={finalFn} color={activeColor} template={id} duration={duration} th={th as Theme} customImg={customImg} />
                    ))}
                    <TrailPreview fn={finalFn} color={activeColor} duration={duration} th={th as Theme} />
                  </div>
                </div>
              </div>

              <div style={{ ...panel(), padding: 14 }}>
                <div style={{ fontSize: 11, color: th.textMuted, fontWeight: 600, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>All Curves</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))", gap: 6 }}>
                  {[...Object.values(categories).flat(), "linear"].map(n => (
                    <div key={n} onClick={() => setRootNode({ type: "simple", name: n })} style={{ cursor: "pointer", borderRadius: 6, border: `1px solid ${selectedName === n ? getColor(n) : th.border}`, overflow: "hidden", background: selectedName === n ? getColor(n) + "11" : th.bg, transition: "border-color 0.15s" }}>
                      <EasingCurve fn={(t) => (evalNode({ type: "simple", name: n }, customFn))(t)} color={getColor(n)} width={72} height={72} th={th} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

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
                    <input type="range" min={i % 2 === 0 ? 0 : -2} max={i % 2 === 0 ? 1 : 3} step={0.001} value={cp[i]} onChange={e => { const n = [...cp]; n[i] = parseFloat(e.target.value); setCp(n); setRootNode({ type: "simple", name: "customCubicBezier" }); }} style={{ width: "100%", accentColor: "#34d399" }} />
                  </div>
                ))}
                <div style={{ marginTop: 12, padding: "10px 12px", background: th.bg, borderRadius: 6, fontFamily: "monospace", fontSize: 12, color: th.textSub }}>
                  <span style={{ color: "#818cf8" }}>cubic-bezier</span>(<span style={{ color: "#34d399" }}>{cp.map(v => v.toFixed(3)).join(", ")}</span>)
                </div>
              </div>
              <div style={{ fontSize: 11, color: th.textMuted, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Template Previews</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {templates.map(({ id }) => (
                  <TemplatePreview key={id} fn={customFn} color="#34d399" template={id} duration={duration} th={th as Theme} customImg={customImg} />
                ))}
                <TrailPreview fn={customFn} color="#34d399" duration={duration} th={th as Theme} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

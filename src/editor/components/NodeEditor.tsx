import { useState } from "react";
import {
  combineModes,
  isAncestorOrSame,
  SINGLE_ARG_MODES,
  type CombineMode,
  type DragCtx,
  type Theme,
  type TweenNode,
} from "../core";

type NodeEditorProps = {
  node: TweenNode;
  onChange: (n: TweenNode) => void;
  th: Theme;
  allNames: string[];
  selectStyle: React.CSSProperties;
  path: string[];
  dragCtx: DragCtx;
};

export function NodeEditor({ node, onChange, th, allNames, selectStyle, path, dragCtx }: NodeEditorProps) {
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

  const handle = path.length > 0 ? (
    <span
      draggable
      onDragStart={e => { e.stopPropagation(); dragCtx.setDragging(path); }}
      onDragEnd={() => { dragCtx.setDragging(null); setOver(false); }}
      title="Drag to swap"
      style={{ cursor: "grab", color: th.textMuted, userSelect: "none", fontSize: 13, lineHeight: 1, opacity: 0.5, flexShrink: 0 }}
    >
      ⠿
    </span>
  ) : null;

  const rowStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
    borderRadius: 6, padding: "2px 0",
    outline: over ? "2px solid #f59e0b" : "none",
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
        <button
          title="Wrap in operation"
          style={btnStyle}
          onClick={() => onChange({
            type: "op",
            mode: "composite",
            a: node,
            b: { type: "simple", name: "linear" },
            mix: 0.5,
            repeatCount: 3,
            clampMin: 0.15,
            clampMax: 0.85,
          })}
        >
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
        <select
          value={node.mode}
          onChange={e => onChange({ ...node, mode: e.target.value as CombineMode })}
          style={{ ...selectStyle, color: "#f59e0b" }}
        >
          {combineModes.filter(m => m.id !== "none").map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
        {(node.mode === "lerp" || node.mode === "average") && (
          <>
            <span style={{ fontSize: 11, color: th.textMuted }}>Mix: {node.mix.toFixed(2)}</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={node.mix}
              onChange={e => onChange({ ...node, mix: parseFloat(e.target.value) })}
              style={{ width: 80, accentColor: "#f59e0b" }}
            />
          </>
        )}
        {(node.mode === "repeat" || node.mode === "zigzag") && (
          <>
            <span style={{ fontSize: 11, color: th.textMuted }}>x{node.repeatCount}</span>
            <input
              type="range"
              min={1}
              max={12}
              step={1}
              value={node.repeatCount}
              onChange={e => onChange({ ...node, repeatCount: parseInt(e.target.value, 10) })}
              style={{ width: 60, accentColor: "#f59e0b" }}
            />
          </>
        )}
        {node.mode === "clamp" && (
          <>
            <span style={{ fontSize: 11, color: th.textMuted }}>[{node.clampMin.toFixed(2)}, {node.clampMax.toFixed(2)}]</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={node.clampMin}
              onChange={e => onChange({ ...node, clampMin: parseFloat(e.target.value) })}
              style={{ width: 60, accentColor: "#f59e0b" }}
            />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={node.clampMax}
              onChange={e => onChange({ ...node, clampMax: parseFloat(e.target.value) })}
              style={{ width: 60, accentColor: "#f59e0b" }}
            />
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

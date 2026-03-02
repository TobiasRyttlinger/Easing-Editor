# Easing Editor

A visual tool for designing, previewing, and combining animation easing curves.

## Features

- **28 built-in easings** across 9 families (Sine, Quad, Cubic, Quart, Expo, Circ, Back, Elastic, Bounce)
- **Custom cubic bézier** editor with draggable control points
- **Tween Tree** — compose complex easing functions by nesting operations recursively
- Animated previews: curve, slide, fade, scale, rotate, bounce, trail
- Custom preview image upload
- Light / dark theme
- Adjustable animation duration

## Tween Tree

The Tween Tree lets you build arbitrarily nested easing operations. Every node in the tree is either a **simple** easing or an **op** that combines two child nodes.

### Node types

| Node | Description |
|---|---|
| Simple | A named easing function (e.g. `easeOutBounce`) or a custom bézier |
| Op | Combines child A and child B using a selected mode |

### Controls

- **`+`** — wraps the current node in a new Composite op (current node becomes A, `linear` becomes B)
- **`−`** — collapses the op back to just A (discards B)
- Changing the mode dropdown on an op updates the operation in place
- Each A and B can independently be expanded further with their own `+` button

### Combine modes

| Mode | Formula | Uses B |
|---|---|---|
| Composite | `A(clamp(B(t)))` — feeds B's output as input to A | yes |
| Multiply | `A(t) × B(t)` | yes |
| Connect | first half = A, second half = B | yes |
| Average | `(A(t) + B(t)) / 2` | yes |
| Lerp | `mix(A(t), B(t), factor)` | yes |
| Crossfade | `mix(A(t), B(t), t)` | yes |
| Yoyo | plays A forward then backward | no |
| Repeat | loops A `n` times | no |
| Zigzag | alternates A forward/backward `n` times | no |
| Clamp | clamps A's output to `[min, max]` | no |

### Example: Composite of Composites

```
Op: Composite
├─ A: Op: Composite
│   ├─ A: easeInOutCubic
│   └─ B: easeOutBounce
└─ B: Op: Repeat ×3
    └─ A: easeInSine
```

This feeds `easeOutBounce` applied to `easeInOutCubic` into the outer Composite, whose B input is `easeInSine` repeated 3 times.

## Library

Clicking any easing in the sidebar or the mini-grid at the bottom resets the tree to a single simple node with that easing. From there, use `+` in the Tween Tree to start composing.

## Bézier Tab

Drag the two control points on the SVG canvas, or use the sliders, to define a custom `cubic-bezier`. The curve is available as `customCubicBezier` in any node's dropdown.

## Development

```bash
npm install
npm run dev      # start dev server
npm run build    # production build
npm run deploy   # deploy to GitHub Pages (gh-pages)
```

Built with React 18, TypeScript, and Vite. No runtime dependencies beyond React.

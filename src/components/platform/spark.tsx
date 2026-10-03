/**
 * Tiny trend line for a Bot card. Server-renderable (no hooks). Daily
 * points are summed into ~10 bins so a sparse Bot still reads as a shape.
 */
export function Sparkline({ points, width = 140, height = 34, label }: { points: number[]; width?: number; height?: number; label: string }) {
  const bins = Math.min(10, points.length);
  const size = Math.ceil(points.length / Math.max(1, bins));
  const vals: number[] = [];
  for (let i = 0; i < points.length; i += size) vals.push(points.slice(i, i + size).reduce((a, b) => a + b, 0));
  const max = Math.max(1, ...vals);
  const pad = 3;
  const xs = vals.map((_, i) => pad + (vals.length <= 1 ? 0 : (i / (vals.length - 1)) * (width - pad * 2)));
  const ys = vals.map((v) => height - pad - (v / max) * (height - pad * 2));
  const d = xs.map((x, i) => `${i ? "L" : "M"}${x.toFixed(1)},${ys[i].toFixed(1)}`).join(" ");
  const area = vals.length > 1 ? `${d} L${xs[xs.length - 1]},${height} L${xs[0]},${height} Z` : "";
  const total = points.reduce((a, b) => a + b, 0);
  return (
    <svg className="pf-spark" width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={label}>
      {total === 0 ? (
        <line x1={pad} x2={width - pad} y1={height - pad} y2={height - pad} className="flat" vectorEffect="non-scaling-stroke" />
      ) : (
        <>
          <path d={area} className="wash" />
          <path d={d} className="ln" vectorEffect="non-scaling-stroke" />
        </>
      )}
    </svg>
  );
}

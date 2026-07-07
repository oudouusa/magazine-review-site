export function Sparkline({
  values,
  width = 120,
  height = 34,
  stroke = "var(--primary)",
}: {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
}) {
  if (!values.length) return null;
  const max = Math.max(...values, 1);
  const pad = 3;
  const w = width - pad * 2;
  const h = height - pad * 2;
  const step = values.length > 1 ? w / (values.length - 1) : 0;
  const pts = values.map((v, i) => [pad + i * step, pad + h - (v / max) * h] as const);
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${pad},${pad + h} ${line} ${pad + w},${pad + h}`;
  const last = pts[pts.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden style={{ display: "block" }}>
      <polygon points={area} fill={stroke} opacity={0.13} />
      <polyline points={line} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r={2.6} fill={stroke} />
    </svg>
  );
}

export type SparklineProps = {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
};

export function Sparkline({
  values,
  width = 96,
  height = 28,
  stroke = "var(--primary)",
}: SparklineProps) {
  if (values.length === 0) return null;

  const max = Math.max(...values, 0) || 1;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const points = values.map((value, index) => {
    const x = values.length > 1 ? index * step : width / 2;
    const y = height - (Math.max(0, value) / max) * (height - 4) - 2;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const areaPoints = [`0,${height}`, ...points, `${width},${height}`].join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-hidden="true">
      <polygon points={areaPoints} fill={stroke} opacity="0.15" />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

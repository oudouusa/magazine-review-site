export type YearBarsProps = {
  data: { year: number; count: number }[];
  height?: number;
};

export function YearBars({ data, height = 72 }: YearBarsProps) {
  if (data.length === 0) return null;

  const width = Math.max(160, data.length * 14);
  const labelHeight = 16;
  const chartHeight = height - labelHeight;
  const max = Math.max(...data.map((item) => item.count), 0) || 1;
  const gap = 3;
  const barWidth = Math.max(4, (width - gap * (data.length - 1)) / data.length);
  const first = data[0]?.year;
  const last = data[data.length - 1]?.year;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="年別掲載数">
      {data.map((item, index) => {
        const barHeight = Math.max(1, (item.count / max) * (chartHeight - 4));
        const x = index * (barWidth + gap);
        const y = chartHeight - barHeight;
        return (
          <rect
            key={item.year}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            rx="2"
            fill="var(--primary)"
            opacity={item.count > 0 ? 0.92 : 0.22}
          >
            <title>{`${item.year}年: ${item.count}件`}</title>
          </rect>
        );
      })}
      <text x="0" y={height - 3} fill="var(--ink-3)" fontSize="10">
        {first}
      </text>
      <text x={width} y={height - 3} fill="var(--ink-3)" fontSize="10" textAnchor="end">
        {last}
      </text>
    </svg>
  );
}

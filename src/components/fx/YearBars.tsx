export function YearBars({ data, height = 96 }: { data: { year: number; count: number }[]; height?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.count), 1);
  const barW = 22;
  const gap = 8;
  const labelH = 18;
  const width = data.length * (barW + gap) - gap;
  const chartH = height - labelH;

  return (
    <div style={{ overflowX: "auto", paddingBottom: 4 }}>
      <svg width={Math.max(width, 200)} height={height} viewBox={`0 0 ${Math.max(width, 200)} ${height}`} role="img"
        aria-label="年別掲載数">
        {data.map((d, i) => {
          const h = Math.max(d.count > 0 ? 3 : 1.5, (d.count / max) * (chartH - 16));
          const x = i * (barW + gap);
          const y = chartH - h;
          const isPeak = d.count === max && max > 0;
          return (
            <g key={d.year}>
              <title>{`${d.year}年: ${d.count}誌`}</title>
              <rect x={x} y={y} width={barW} height={h} rx={2.5}
                fill={isPeak ? "var(--amber)" : "var(--primary)"} opacity={d.count === 0 ? 0.25 : 0.9} />
              {d.count > 0 && (
                <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={9.5}
                  fill="var(--ink-3)" className="mh-num">{d.count}</text>
              )}
              <text x={x + barW / 2} y={height - 4} textAnchor="middle" fontSize={9.5}
                fill={isPeak ? "var(--amber)" : "var(--ink-3)"} className="mh-num">
                {String(d.year).slice(2)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

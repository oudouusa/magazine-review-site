import Link from "next/link";
import { Sparkline } from "./Sparkline";

export type ModelCardProps = {
  href: string;
  name: string;
  sub?: string;
  imageUrl?: string;
  c1: string;
  c2: string;
  rank?: number;
  spark?: number[];
};

export function ModelCard({ href, name, sub, imageUrl, c1, c2, rank, spark }: ModelCardProps) {
  const background = imageUrl
    ? `linear-gradient(180deg, rgba(0,0,0,0) 54%, rgba(0,0,0,0.64) 100%), url("${imageUrl}") center / cover no-repeat`
    : `linear-gradient(145deg, ${c1}, ${c2})`;
  const filledRank = typeof rank === "number" && rank <= 3;

  return (
    <Link
      href={href}
      className="mh-lift"
      style={{
        display: "block",
        width: 156,
        minWidth: 156,
        borderRadius: 8,
        border: "1px solid var(--line)",
        background: "var(--bg-2)",
        color: "var(--ink)",
        overflow: "hidden",
        textDecoration: "none",
      }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "1 / 1",
          background,
        }}
      >
        {rank && (
          <span
            className="mh-num"
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              minWidth: 28,
              borderRadius: 999,
              border: `1px solid var(--accent)`,
              background: filledRank ? "var(--accent)" : "rgba(0,0,0,0.42)",
              color: filledRank ? "#1a1510" : "var(--accent)",
              fontSize: 12,
              fontWeight: 900,
              lineHeight: 1,
              padding: "6px 7px",
              textAlign: "center",
            }}
          >
            {rank}
          </span>
        )}
      </div>
      <div style={{ padding: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.35, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {name}
        </div>
        {sub && <div style={{ marginTop: 3, color: "var(--ink-2)", fontSize: 12 }}>{sub}</div>}
        {spark && spark.length > 0 && (
          <div style={{ marginTop: 8, height: 28 }}>
            <Sparkline values={spark} width={132} height={28} />
          </div>
        )}
      </div>
    </Link>
  );
}

import Link from "next/link";
import { Sparkline } from "./Sparkline";

export function ModelCard({
  href,
  name,
  sub,
  imageUrl,
  c1,
  c2,
  rank,
  spark,
  width = 150,
}: {
  href: string;
  name: string;
  sub?: string;
  imageUrl?: string;
  c1: string;
  c2: string;
  rank?: number;
  spark?: number[];
  width?: number | string;
}) {
  return (
    <Link
      href={href}
      className="mh-lift"
      style={{
        width,
        display: "block",
        textDecoration: "none",
        background: "var(--paper)",
        border: "1px solid var(--line)",
        borderRadius: 10,
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          display: "block",
          aspectRatio: "1 / 1",
          position: "relative",
          background: imageUrl
            ? `url("${imageUrl}") center 22% / cover no-repeat, linear-gradient(150deg, ${c1}, ${c2})`
            : `linear-gradient(150deg, ${c1}, ${c2})`,
        }}
      >
        {rank !== undefined && (
          <span
            className="serif mh-num"
            aria-label={`${rank}位`}
            style={{
              position: "absolute",
              top: 6,
              left: 8,
              fontSize: rank <= 3 ? 30 : 22,
              fontWeight: 900,
              fontStyle: "italic",
              lineHeight: 1,
              color: rank <= 3 ? "var(--amber)" : "rgba(247,243,236,.88)",
              textShadow: "0 2px 8px rgba(0,0,0,.55)",
            }}
          >
            {rank}
          </span>
        )}
        {!imageUrl && (
          <span
            className="serif"
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 700,
              color: "rgba(247,243,236,.85)",
            }}
          >
            {name.slice(0, 1)}
          </span>
        )}
      </span>
      <span style={{ display: "block", padding: "9px 11px 11px" }}>
        <span
          style={{
            display: "block",
            color: "var(--ink)",
            fontSize: 13.5,
            fontWeight: 700,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </span>
        {sub && (
          <span className="mh-num" style={{ display: "block", color: "var(--ink-3)", fontSize: 11, marginTop: 2 }}>
            {sub}
          </span>
        )}
        {spark && spark.some((v) => v > 0) && (
          <span style={{ display: "block", marginTop: 6 }}>
            <Sparkline values={spark} width={Math.max(100, Number(width) - 26)} height={26} />
          </span>
        )}
      </span>
    </Link>
  );
}

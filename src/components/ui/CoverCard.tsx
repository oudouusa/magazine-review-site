import Link from "next/link";

export type CoverCardProps = {
  href: string;
  title: string;
  sub?: string;
  imageUrl?: string;
  c1: string;
  c2: string;
  badge?: string;
  width?: number | string;
  showTitleOverlay?: boolean;
};

export function CoverCard({
  href,
  title,
  sub,
  imageUrl,
  c1,
  c2,
  badge,
  width = 168,
  showTitleOverlay = true,
}: CoverCardProps) {
  const background = imageUrl
    ? `linear-gradient(180deg, rgba(0,0,0,0) 48%, rgba(0,0,0,0.72) 100%), url("${imageUrl}") center / cover no-repeat`
    : `linear-gradient(160deg, ${c1}, ${c2})`;

  return (
    <Link
      href={href}
      className="mh-lift"
      style={{
        position: "relative",
        display: "flex",
        width,
        minWidth: width,
        aspectRatio: "3 / 4",
        borderRadius: 8,
        overflow: "hidden",
        border: "1px solid var(--line)",
        background,
        color: imageUrl ? "#fff" : "var(--ink)",
        textDecoration: "none",
        boxShadow: "0 10px 28px rgba(0,0,0,0.20)",
      }}
    >
      {badge && (
        <span
          style={{
            position: "absolute",
            left: 8,
            top: 8,
            zIndex: 2,
            borderRadius: 999,
            background: "var(--primary)",
            color: "#fff",
            fontSize: 10,
            fontWeight: 800,
            lineHeight: 1,
            padding: "5px 7px",
          }}
        >
          {badge}
        </span>
      )}
      {imageUrl && showTitleOverlay ? (
        <span style={{ alignSelf: "flex-end", padding: 12, width: "100%" }}>
          <span style={{ display: "block", fontSize: 13, fontWeight: 800, lineHeight: 1.35 }}>{title}</span>
          {sub && <span style={{ display: "block", marginTop: 4, color: "rgba(255,255,255,0.78)", fontSize: 11 }}>{sub}</span>}
        </span>
      ) : (
        <span
          style={{
            alignSelf: "center",
            display: "block",
            margin: "0 auto",
            maxWidth: "82%",
            textAlign: "center",
            textShadow: imageUrl ? "0 1px 8px rgba(0,0,0,0.5)" : "none",
          }}
        >
          <span className="mh-serif" style={{ display: "block", fontSize: 16, fontWeight: 700, lineHeight: 1.35 }}>{title}</span>
          {sub && <span style={{ display: "block", marginTop: 8, color: imageUrl ? "rgba(255,255,255,0.78)" : "var(--ink-2)", fontSize: 12 }}>{sub}</span>}
        </span>
      )}
    </Link>
  );
}

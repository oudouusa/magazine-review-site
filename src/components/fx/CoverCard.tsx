import Link from "next/link";
import { cssBgUrl, safeHttpUrl } from "@/lib/safe-url";

export function CoverCard({
  href,
  title,
  sub,
  imageUrl,
  c1,
  c2,
  obi,
  obiTone,
  width = 150,
  minTitle = false,
}: {
  href: string;
  title: string;
  sub?: string;
  imageUrl?: string;
  c1: string;
  c2: string;
  obi?: string;
  obiTone?: "gold";
  width?: number | string;
  minTitle?: boolean;
}) {
  const safeImage = safeHttpUrl(imageUrl);
  return (
    <Link
      href={href}
      className="mh-lift"
      style={{
        width,
        aspectRatio: "3 / 4",
        borderRadius: 8,
        position: "relative",
        overflow: "hidden",
        display: "block",
        textDecoration: "none",
        background: safeImage
          ? `${cssBgUrl(safeImage)} center / cover no-repeat, linear-gradient(160deg, ${c1}, ${c2})`
          : `linear-gradient(160deg, ${c1}, ${c2})`,
        border: "1px solid var(--line)",
        flexShrink: 0,
      }}
    >
      {!safeImage && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(at 30% 20%, rgba(255,255,255,.18), transparent 55%)",
          }}
        />
      )}
      {obi && <span className={`mh-obi${obiTone === "gold" ? " gold" : ""}`}>{obi}</span>}
      <span
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "26px 10px 9px",
          background: "linear-gradient(transparent, rgba(10,8,6,.86))",
          display: "block",
        }}
      >
        <span
          className="serif"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: minTitle ? 1 : 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            color: "#f7f3ec",
            fontSize: 12.5,
            fontWeight: 700,
            lineHeight: 1.45,
            letterSpacing: "0.03em",
          }}
        >
          {title}
        </span>
        {sub && (
          <span
            className="mh-num"
            style={{ display: "block", color: "rgba(247,243,236,.72)", fontSize: 10.5, marginTop: 3, letterSpacing: "0.06em" }}
          >
            {sub}
          </span>
        )}
      </span>
    </Link>
  );
}

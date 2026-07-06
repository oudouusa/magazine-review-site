import Link from "next/link";

export type SectionHeaderProps = {
  title: string;
  icon?: string;
  subtitle?: string;
  moreHref?: string;
  moreLabel?: string;
};

export function SectionHeader({ title, icon, subtitle, moreHref, moreLabel }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 16,
        marginBottom: 16,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {icon && <span aria-hidden="true" style={{ fontSize: 18 }}>{icon}</span>}
          <h2 className="mh-serif" style={{ margin: 0, color: "var(--ink)", fontSize: 22, lineHeight: 1.25, fontWeight: 700 }}>
            {title}
          </h2>
        </div>
        {subtitle && (
          <p style={{ margin: "5px 0 0", color: "var(--ink-2)", fontSize: 13, lineHeight: 1.5 }}>
            {subtitle}
          </p>
        )}
      </div>
      {moreHref && (
        <Link
          href={moreHref}
          style={{
            color: "var(--primary)",
            flexShrink: 0,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
            whiteSpace: "nowrap",
          }}
        >
          {moreLabel ?? "すべて見る"} -&gt;
        </Link>
      )}
    </div>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";

export function SectionHead({
  eyebrow,
  title,
  moreHref,
  moreLabel,
  children,
}: {
  eyebrow: string;
  title: string;
  moreHref?: string;
  moreLabel?: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-head">
      <div>
        <div className="sh-eyebrow">{eyebrow}</div>
        <h2 className="sh-title">{title}</h2>
      </div>
      {children}
      <div className="sh-rule" />
      {moreHref && (
        <Link href={moreHref} className="sh-more">
          {moreLabel ?? "すべて見る"}
        </Link>
      )}
    </div>
  );
}

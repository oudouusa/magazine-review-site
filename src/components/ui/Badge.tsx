import type { ReactNode } from "react";

export type BadgeProps = {
  children: ReactNode;
  tone?: "primary" | "accent" | "ok" | "info" | "muted";
};

const tones: Record<NonNullable<BadgeProps["tone"]>, { color: string; bg: string; border: string }> = {
  primary: { color: "var(--primary)", bg: "var(--primary-2)", border: "rgba(232, 84, 111, 0.28)" },
  accent: { color: "var(--accent)", bg: "rgba(245, 184, 61, 0.14)", border: "rgba(245, 184, 61, 0.28)" },
  ok: { color: "var(--ok)", bg: "rgba(62, 207, 142, 0.14)", border: "rgba(62, 207, 142, 0.28)" },
  info: { color: "var(--info)", bg: "rgba(90, 167, 240, 0.14)", border: "rgba(90, 167, 240, 0.28)" },
  muted: { color: "var(--ink-2)", bg: "var(--bg-3)", border: "var(--line)" },
};

export function Badge({ children, tone = "primary" }: BadgeProps) {
  const style = tones[tone];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        borderRadius: 999,
        border: `1px solid ${style.border}`,
        background: style.bg,
        color: style.color,
        fontSize: 11,
        fontWeight: 700,
        lineHeight: 1,
        padding: "5px 8px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

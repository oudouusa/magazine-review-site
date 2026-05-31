import type { ReactNode } from "react";

type InfoSection = {
  id?: string;
  title: string;
  children: ReactNode;
};

export function InfoPage({
  eyebrow,
  title,
  description,
  sections,
}: {
  eyebrow: string;
  title: string;
  description: string;
  sections: InfoSection[];
}) {
  return (
    <>
      <div className="info-hero">
        <div className="info-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <div className="info-wrap">
        <article className="info-article">
          {sections.map((section) => (
            <section key={section.title} id={section.id} className="info-section">
              <h2>{section.title}</h2>
              <div className="info-body">{section.children}</div>
            </section>
          ))}
        </article>
      </div>

      <style>{`
        .info-hero {
          background: linear-gradient(120deg, var(--primary-2) 0%, var(--rose-3) 100%);
          border-bottom: 1px solid var(--line);
          padding: 32px var(--pad) 28px;
        }
        .info-eyebrow {
          font-family: "Noto Serif JP", serif;
          font-size: 10px;
          letter-spacing: 0.32em;
          color: var(--ink-3);
          margin-bottom: 6px;
        }
        .info-hero h1 {
          font-family: "Noto Serif JP", serif;
          font-size: 32px;
          font-weight: 600;
          letter-spacing: 0.1em;
          margin: 0;
          color: var(--ink);
        }
        .info-hero p {
          max-width: 720px;
          font-size: 13px;
          line-height: 1.85;
          color: var(--ink-2);
          letter-spacing: 0.04em;
          margin: 8px 0 0;
        }
        .info-wrap {
          padding: var(--row-gap) var(--pad);
        }
        .info-article {
          max-width: 880px;
        }
        .info-section {
          border-top: 1px solid var(--line);
          display: grid;
          grid-template-columns: 220px minmax(0, 1fr);
          gap: 28px;
          padding: 24px 0;
          scroll-margin-top: 72px;
        }
        .info-section:first-child {
          border-top: 0;
          padding-top: 0;
        }
        .info-section h2 {
          font-family: "Noto Serif JP", serif;
          font-size: 17px;
          font-weight: 600;
          letter-spacing: 0.08em;
          line-height: 1.55;
          margin: 0;
          color: var(--ink);
        }
        .info-body {
          color: var(--ink-2);
          font-size: 13px;
          line-height: 1.9;
          letter-spacing: 0.04em;
        }
        .info-body p {
          margin: 0 0 12px;
        }
        .info-body p:last-child {
          margin-bottom: 0;
        }
        .info-body a {
          color: var(--primary);
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .info-list {
          margin: 0;
          padding-left: 1.2em;
        }
        .info-list li {
          margin: 0 0 8px;
        }
        .info-note {
          color: var(--ink-3);
          font-size: 12px;
        }
        @media (max-width: 640px) {
          .info-hero h1 {
            font-size: 24px;
          }
          .info-section {
            grid-template-columns: 1fr;
            gap: 10px;
            padding: 20px 0;
          }
        }
      `}</style>
    </>
  );
}

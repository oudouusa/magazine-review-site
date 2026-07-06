import "../globals.css";
import { SiteNav } from "@/components/SiteNav";
import { SiteFooter } from "@/components/SiteFooter";
import type { ReactNode } from "react";

export default function FrontendLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja" data-theme="night" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#141210" />
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{var t=localStorage.getItem("mh-theme");if(t==="light"||t==="night")document.documentElement.dataset.theme=t}catch(e){}',
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700;900&family=Noto+Serif+JP:wght@600;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body data-density="normal">
        <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
          <SiteNav />
          <main>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}

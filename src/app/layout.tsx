import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s | MODEL HUB",
    default: "MODEL HUB — グラビア雑誌・写真集アーカイブ",
  },
  description:
    "グラビア雑誌・写真集のコレクター向けアーカイブサイト。Amazon・楽天・FANZAの3社価格比較つき。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&family=Noto+Serif+JP:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body data-theme="sakura" data-density="normal">
        {children}
      </body>
    </html>
  );
}

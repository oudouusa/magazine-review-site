import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: {
    template: "%s | MODEL HUB",
    default: "MODEL HUB — グラビア雑誌・写真集アーカイブ",
  },
  description:
    "グラビア雑誌・写真集のコレクター向けアーカイブサイト。Amazon・楽天・FANZAの3社価格比較つき。",
};

// Sub-layouts ((frontend) and (payload)/admin) each render their own <html>/<body>.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}

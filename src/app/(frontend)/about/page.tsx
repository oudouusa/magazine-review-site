import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "このサイトについて",
  description: "MODEL HUBの運営方針、掲載データ、アフィリエイト広告について。",
};

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow="ABOUT MODEL HUB"
      title="このサイトについて"
      description="MODEL HUBは、グラビア雑誌・写真集を探しやすくするためのアーカイブ型レビューサイトです。気になる号からAmazon・楽天の商品ページへ進める導線を重視しています。"
      sections={[
        {
          title: "運営方針",
          children: (
            <>
              <p>
                雑誌名、発売日、登場モデル、表紙画像、購入リンクを整理し、コレクションや新刊チェックに使いやすい形で掲載しています。
              </p>
              <p>
                表示内容は公開情報と内部データベースをもとに編集しています。価格、在庫、販売条件は各ストアの商品ページで確認してください。
              </p>
            </>
          ),
        },
        {
          id: "affiliate",
          title: "広告掲載について",
          children: (
            <>
              <p>
                本サイトにはAmazon、楽天などのアフィリエイト広告リンクが含まれます。リンク先で購入が発生した場合、当サイトが紹介料を受け取ることがあります。
              </p>
              <p>
                アフィリエイトの詳細は<Link href="/affiliate-disclosure">アフィリエイト開示</Link>をご確認ください。
              </p>
            </>
          ),
        },
        {
          title: "掲載画像",
          children: (
            <>
              <p>
                表紙画像やモデル画像は、サイト内の表示に適したものだけを使用します。直接的な表現が強い画像は、一覧や詳細ページで表示しない方針です。
              </p>
              <p className="info-note">
                画像がない場合は、同じ雑誌・モデルに紐づく別画像やプレースホルダーを表示します。
              </p>
            </>
          ),
        },
      ]}
    />
  );
}

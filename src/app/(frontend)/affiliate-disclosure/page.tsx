import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "アフィリエイト開示",
  description: "MODEL HUBに掲載しているアフィリエイト広告リンクの開示事項。",
};

export default function AffiliateDisclosurePage() {
  return (
    <InfoPage
      eyebrow="AFFILIATE DISCLOSURE"
      title="アフィリエイト開示"
      description="MODEL HUBでは、雑誌・写真集の商品ページへ案内するためにアフィリエイト広告リンクを使用しています。"
      sections={[
        {
          title: "広告リンク",
          children: (
            <>
              <p>
                Amazon、楽天などのリンクにはアフィリエイト識別子が含まれる場合があります。リンク先で商品購入やサービス利用が発生した場合、当サイトが紹介料を受け取ることがあります。
              </p>
              <p>
                読者の購入価格が、当サイトのリンク経由で変わることはありません。
              </p>
            </>
          ),
        },
        {
          title: "表示内容",
          children: (
            <>
              <p>
                商品名、発売日、在庫、価格、配送条件、電子版の有無は、リンク先ストアの情報が優先されます。購入前に各ストアの商品ページで最新情報を確認してください。
              </p>
              <p className="info-note">
                MODEL HUBはAmazonアソシエイト・プログラムをはじめとするアフィリエイトプログラムに参加しています。
              </p>
            </>
          ),
        },
        {
          title: "編集方針",
          children: (
            <p>
              掲載順や紹介内容は、発売時期、表紙画像、登場モデル、リンクの取得状況などをもとに構成しています。
            </p>
          ),
        },
      ]}
    />
  );
}

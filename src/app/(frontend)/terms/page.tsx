import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "利用規約",
  description: "MODEL HUBの利用規約。",
};

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow="TERMS"
      title="利用規約"
      description="MODEL HUBを利用する際の基本的な条件です。"
      sections={[
        {
          title: "掲載情報",
          children: (
            <p>
              本サイトは、雑誌・写真集の情報を探しやすくする目的で掲載しています。内容の正確性には注意していますが、完全性や最新性を保証するものではありません。
            </p>
          ),
        },
        {
          title: "購入・取引",
          children: (
            <p>
              Amazon、楽天などリンク先での購入、配送、返品、問い合わせは、各ストアの規約に従って行われます。本サイトはリンク先での取引内容について責任を負いません。
            </p>
          ),
        },
        {
          title: "禁止事項",
          children: (
            <ul className="info-list">
              <li>本サイトの表示や運営を妨げる行為</li>
              <li>掲載データや画像を無断で大量取得、再配布する行為</li>
              <li>第三者の権利を侵害する行為</li>
            </ul>
          ),
        },
      ]}
    />
  );
}

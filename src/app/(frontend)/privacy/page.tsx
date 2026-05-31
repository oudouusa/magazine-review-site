import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: "MODEL HUBのプライバシーポリシー。",
};

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow="PRIVACY POLICY"
      title="プライバシーポリシー"
      description="MODEL HUBにおけるアクセス情報、外部サービス、広告リンクの取り扱いについて説明します。"
      sections={[
        {
          title: "取得する情報",
          children: (
            <p>
              本サイトでは、サービス改善や不具合調査のため、アクセス日時、閲覧ページ、ブラウザ情報などの技術的な情報をサーバーログとして取得する場合があります。
            </p>
          ),
        },
        {
          title: "外部リンク",
          children: (
            <p>
              本サイトにはAmazon、楽天など外部サイトへのリンクが含まれます。リンク先で取得される情報やCookieの取り扱いは、各外部サイトのポリシーに従います。
            </p>
          ),
        },
        {
          title: "ポリシーの変更",
          children: (
            <p>
              本ポリシーは、法令やサービス内容の変更に応じて更新することがあります。重要な変更がある場合は、サイト上で分かる形で反映します。
            </p>
          ),
        },
      ]}
    />
  );
}

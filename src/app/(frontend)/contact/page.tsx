import type { Metadata } from "next";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description: "MODEL HUBへのお問い合わせ、掲載内容の修正依頼について。",
};

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow="CONTACT"
      title="お問い合わせ"
      description="掲載内容の修正依頼、不具合報告、権利者からのご連絡は、内容を確認できる形でお送りください。"
      sections={[
        {
          title: "掲載内容の修正",
          children: (
            <>
              <p>
                雑誌名、発売日、登場モデル、リンク先の誤りを見つけた場合は、該当ページのURLと修正内容を添えてご連絡ください。
              </p>
              <p>
                GitHubの
                <a href="https://github.com/oudouusa/magazine-review-site/issues" target="_blank" rel="noopener noreferrer">
                  Issues
                </a>
                から報告できます。
              </p>
            </>
          ),
        },
        {
          title: "画像・権利に関する連絡",
          children: (
            <p>
              画像の削除依頼や権利に関するご連絡も、該当ページURL、対象箇所、確認可能な情報を添えてお送りください。確認後、必要に応じて表示停止や修正を行います。
            </p>
          ),
        },
      ]}
    />
  );
}

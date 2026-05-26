/* Mock data matching the handoff data shapes */

export type ModelStub = {
  slug: string;
  name: string;
  nameYomi: string;
  tags: string[];
  stats: { issues: number; photobooks: number; covers: number };
  gradient: { c1: string; c2: string; c3: string; c4: string };
  trend?: "up" | "down" | "new";
};

export type MagazineStub = {
  slug: string;
  title: string;
  seriesName: string;
  issue: string;
  publisher: string;
  releaseDate: string;
  gradient: { c1: string; c2: string };
  price: number;
  badge?: "new" | "preorder" | "reissue";
  featureModel?: string;
};

export type FeatureArticle = {
  slug: string;
  title: string;
  lede: string;
  category: string;
  author: string;
  date: string;
  gradient: { c1: string; c2: string };
};

export const TOP10_MODELS: (ModelStub & { rank: number })[] = [
  { rank: 1, slug: "asahina-yui", name: "朝比奈 結衣", nameYomi: "あさひな ゆい", tags: ["グラビア", "アイドル"], stats: { issues: 48, photobooks: 3, covers: 12 }, gradient: { c1: "#f5d8c8", c2: "#e8c2cc", c3: "#f1d9d2", c4: "#d4a8b2" }, trend: "up" },
  { rank: 2, slug: "miura-seira", name: "三浦 聖良", nameYomi: "みうら せいら", tags: ["グラビア", "モデル"], stats: { issues: 35, photobooks: 2, covers: 8 }, gradient: { c1: "#bcc6d9", c2: "#5a6b8f", c3: "#8ea0c4", c4: "#4a5a7a" }, trend: "new" },
  { rank: 3, slug: "hayashi-rin", name: "林 凛", nameYomi: "はやし りん", tags: ["グラビア", "女優"], stats: { issues: 52, photobooks: 5, covers: 15 }, gradient: { c1: "#d9c8f0", c2: "#8a6bbc", c3: "#c8b2e8", c4: "#7a5aaa" }, trend: "down" },
  { rank: 4, slug: "yamamoto-ai", name: "山本 愛", nameYomi: "やまもと あい", tags: ["グラビア", "アイドル"], stats: { issues: 29, photobooks: 1, covers: 6 }, gradient: { c1: "#f0d4b8", c2: "#c88a5a", c3: "#e8c8a0", c4: "#b87a4a" }, trend: "up" },
  { rank: 5, slug: "kobayashi-nana", name: "小林 菜々", nameYomi: "こばやし なな", tags: ["グラビア"], stats: { issues: 22, photobooks: 0, covers: 4 }, gradient: { c1: "#c8d8c8", c2: "#5a8f5a", c3: "#b8ceb8", c4: "#4a7a4a" }, trend: "new" },
  { rank: 6, slug: "tanaka-miku", name: "田中 美空", nameYomi: "たなか みく", tags: ["グラビア", "モデル"], stats: { issues: 41, photobooks: 3, covers: 9 }, gradient: { c1: "#f8d0d8", c2: "#c85a78", c3: "#f0b8c8", c4: "#b84a68" }, trend: "up" },
  { rank: 7, slug: "sato-honoka", name: "佐藤 ほのか", nameYomi: "さとう ほのか", tags: ["グラビア", "アイドル"], stats: { issues: 18, photobooks: 1, covers: 3 }, gradient: { c1: "#f8e8c0", c2: "#c8a040", c3: "#f0d8a8", c4: "#b89030" }, trend: "down" },
  { rank: 8, slug: "ito-yuki", name: "伊藤 雪", nameYomi: "いとう ゆき", tags: ["グラビア", "女優"], stats: { issues: 33, photobooks: 2, covers: 7 }, gradient: { c1: "#c8e0f0", c2: "#4880b8", c3: "#b8d4e8", c4: "#3870a8" }, trend: "up" },
  { rank: 9, slug: "nakamura-hana", name: "中村 花", nameYomi: "なかむら はな", tags: ["グラビア"], stats: { issues: 15, photobooks: 0, covers: 2 }, gradient: { c1: "#e8d0f0", c2: "#9060c8", c3: "#d8c0e8", c4: "#8050b8" }, trend: "new" },
  { rank: 10, slug: "watanabe-sora", name: "渡辺 空", nameYomi: "わたなべ そら", tags: ["グラビア", "モデル"], stats: { issues: 27, photobooks: 2, covers: 5 }, gradient: { c1: "#d0e8d0", c2: "#60a860", c3: "#c0d8c0", c4: "#509850" }, trend: "down" },
];

export const LATEST_ISSUES: MagazineStub[] = [
  { slug: "luna-weekly-482", title: "朝比奈 結衣 ２０ページ大特集", seriesName: "Luna Weekly", issue: "No.482", publisher: "サンライズ出版", releaseDate: "2026/05/22", gradient: { c1: "#dccfb8", c2: "#9a8b6b" }, price: 620, badge: "new", featureModel: "朝比奈 結衣" },
  { slug: "friday-2026-06a", title: "夏のビキニ速報！完全版", seriesName: "FRIDAY", issue: "2026年6月A号", publisher: "講談社", releaseDate: "2026/05/20", gradient: { c1: "#c8a39d", c2: "#6a3a45" }, price: 480, badge: "new" },
  { slug: "flash-special", title: "グラビア黄金時代 総決算", seriesName: "FLASH スペシャル", issue: "グラビアBEST", publisher: "光文社", releaseDate: "2026/05/18", gradient: { c1: "#bcc6d9", c2: "#5a6b8f" }, price: 980, badge: "new" },
  { slug: "young-jump-2026-26", title: "夏グラ先取り大特集", seriesName: "ヤングジャンプ", issue: "2026年26号", publisher: "集英社", releaseDate: "2026/05/22", gradient: { c1: "#d9c8f0", c2: "#8a6bbc" }, price: 430, badge: "new" },
  { slug: "weekly-playboy-23", title: "水着グラビア完全保存版", seriesName: "週刊プレイボーイ", issue: "2026年23号", publisher: "集英社", releaseDate: "2026/05/20", gradient: { c1: "#f0d4b8", c2: "#c88a5a" }, price: 510, badge: "new" },
];

export const EDITOR_PICKS: (MagazineStub & {
  photographer?: string;
  quote?: string;
  pageCount?: number;
  format?: string;
  featured: boolean;
})[] = [
  {
    slug: "asahina-yui-pb-first",
    title: "朝比奈 結衣 ファースト写真集",
    seriesName: "写真集",
    issue: "1st",
    publisher: "サンライズ出版",
    releaseDate: "2026/04/10",
    gradient: { c1: "#f5d8c8", c2: "#d4a8b2" },
    price: 3300,
    photographer: "Takashi Yamamoto",
    quote: "デビュー３年目にして初の写真集。沖縄の青と彼女の白が織りなす、まだ誰も見ていない朝比奈結衣がここにある。",
    pageCount: 96,
    format: "A4変型",
    featured: true,
  },
  {
    slug: "tanaka-miku-2nd",
    title: "田中 美空 2nd写真集「月光」",
    seriesName: "写真集",
    issue: "2nd",
    publisher: "講談社",
    releaseDate: "2026/03/20",
    gradient: { c1: "#bcc6d9", c2: "#5a6b8f" },
    price: 2860,
    featured: false,
  },
  {
    slug: "miura-seira-1st",
    title: "三浦 聖良 1st写真集「白昼夢」",
    seriesName: "写真集",
    issue: "1st",
    publisher: "集英社",
    releaseDate: "2026/02/28",
    gradient: { c1: "#d9c8f0", c2: "#8a6bbc" },
    price: 2970,
    featured: false,
  },
  {
    slug: "hayashi-rin-3rd",
    title: "林 凛 3rd写真集「冬の光」",
    seriesName: "写真集",
    issue: "3rd",
    publisher: "小学館",
    releaseDate: "2026/01/15",
    gradient: { c1: "#f0d4b8", c2: "#c88a5a" },
    price: 3080,
    featured: false,
  },
];

export const GENRES = [
  { label: "週刊グラビア誌", count: 12, gradient: { c1: "#d9c8f0", c2: "#6a4a9a" } },
  { label: "月刊グラビア誌", count: 8, gradient: { c1: "#bcc6d9", c2: "#3a5a8f" } },
  { label: "写真集", count: 156, gradient: { c1: "#f5d8c8", c2: "#c87a6a" } },
  { label: "電子限定", count: 43, gradient: { c1: "#c8d8c8", c2: "#4a7a4a" } },
  { label: "水着グラビア", count: 89, gradient: { c1: "#b8d8f0", c2: "#3a6a9a" } },
  { label: "アイドル系", count: 67, gradient: { c1: "#f8d0d8", c2: "#c84a78" } },
  { label: "女優系", count: 34, gradient: { c1: "#f8e8c0", c2: "#c89040" } },
  { label: "復刻・絶版", count: 28, gradient: { c1: "#e0d0c0", c2: "#8a6040" } },
  { label: "表紙常連", count: 15, gradient: { c1: "#e8d0f0", c2: "#8050c8" } },
  { label: "ランジェリー", count: 52, gradient: { c1: "#f0c0c8", c2: "#b84060" } },
  { label: "初版コレクション", count: 23, gradient: { c1: "#c8e8c8", c2: "#3a803a" } },
  { label: "限定版", count: 19, gradient: { c1: "#d0c8f0", c2: "#5048a8" } },
];

export const NEW_ARRIVALS: MagazineStub[] = [
  { slug: "asahina-yui-pb-first", title: "朝比奈 結衣", seriesName: "ファースト写真集", issue: "1st", publisher: "", releaseDate: "2026/04/10", gradient: { c1: "#f5d8c8", c2: "#d4a8b2" }, price: 3300, badge: "new" },
  { slug: "luna-weekly-482", title: "朝比奈 結衣", seriesName: "Luna Weekly", issue: "No.482", publisher: "", releaseDate: "2026/05/22", gradient: { c1: "#dccfb8", c2: "#9a8b6b" }, price: 620, badge: "new" },
  { slug: "friday-2026-06a", title: "夏のビキニ速報", seriesName: "FRIDAY", issue: "2026年6月A号", publisher: "", releaseDate: "2026/05/20", gradient: { c1: "#c8a39d", c2: "#6a3a45" }, price: 480, badge: "new" },
  { slug: "tanaka-miku-2nd", title: "田中 美空", seriesName: "2nd写真集「月光」", issue: "2nd", publisher: "", releaseDate: "2026/03/20", gradient: { c1: "#bcc6d9", c2: "#5a6b8f" }, price: 2860, badge: "preorder" },
  { slug: "young-jump-2026-26", title: "夏グラ先取り大特集", seriesName: "ヤングジャンプ", issue: "2026年26号", publisher: "", releaseDate: "2026/05/22", gradient: { c1: "#d9c8f0", c2: "#8a6bbc" }, price: 430 },
  { slug: "flash-special", title: "グラビア黄金時代 総決算", seriesName: "FLASH スペシャル", issue: "グラビアBEST", publisher: "", releaseDate: "2026/05/18", gradient: { c1: "#f0d4b8", c2: "#c88a5a" }, price: 980, badge: "reissue" },
];

export const FEATURE_ARTICLES: FeatureArticle[] = [
  { slug: "first-edition-guide", title: "初版の見分け方・完全ガイド", lede: "写真集コレクターなら必ず知っておきたい、初版と重版の見分け方。背表紙の印刷番号から奥付の確認方法まで徹底解説。", category: "解説", author: "編集部", date: "2026/05/15", gradient: { c1: "#f5d4dc", c2: "#c87890" } },
  { slug: "interview-asahina", title: "朝比奈 結衣 特別インタビュー", lede: "ファースト写真集発売を前に、撮影の裏話から今後の活動まで。独占インタビューを全文掲載。", category: "インタビュー", author: "編集部", date: "2026/05/10", gradient: { c1: "#bcc6d9", c2: "#5a6b8f" } },
  { slug: "luna-weekly-history", title: "Luna Weekly 40年の歴史", lede: "1986年創刊から続くグラビア誌の金字塔。歴代表紙モデルと時代を彩った名作グラビアを一挙紹介。", category: "特集", author: "編集部", date: "2026/05/05", gradient: { c1: "#f0d4b8", c2: "#c88a5a" } },
];

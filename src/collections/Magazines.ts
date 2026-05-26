import type { CollectionConfig } from "payload";

export const Magazines: CollectionConfig = {
  slug: "magazines",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "type", "releaseDate", "status", "updatedAt"],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      label: "タイトル (例: Luna Weekly No.482)",
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: { position: "sidebar" },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      options: [
        { label: "下書き", value: "draft" },
        { label: "公開", value: "published" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "type",
      type: "select",
      required: true,
      label: "種別",
      options: [
        { label: "週刊誌", value: "weekly" },
        { label: "月刊誌", value: "monthly" },
        { label: "写真集", value: "photobook" },
        { label: "電子限定", value: "digital-only" },
        { label: "復刻版", value: "reissue" },
        { label: "限定版", value: "limited" },
      ],
    },
    {
      name: "publisher",
      type: "text",
      label: "出版社",
    },
    {
      name: "seriesName",
      type: "text",
      label: "誌名 (例: Luna Weekly)",
    },
    {
      name: "issue",
      type: "text",
      label: "号数 (例: No.482)",
    },
    {
      name: "releaseDate",
      type: "date",
      required: true,
      label: "発売日",
      admin: { position: "sidebar" },
    },
    {
      name: "subTitle",
      type: "text",
      label: "サブタイトル・特集コピー",
    },
    {
      name: "pages",
      type: "number",
      label: "ページ数",
    },
    {
      name: "format",
      type: "text",
      label: "判型 (例: B5判 平とじ)",
    },
    {
      name: "isbn",
      type: "text",
      label: "ISBN",
    },
    {
      name: "jan",
      type: "text",
      label: "JANコード",
    },
    {
      name: "coverGradient",
      type: "group",
      label: "カバーグラデーション",
      fields: [
        { name: "c1", type: "text", defaultValue: "#dccfb8" },
        { name: "c2", type: "text", defaultValue: "#9a8b6b" },
      ],
    },
    {
      name: "coverImage",
      type: "upload",
      relationTo: "media",
      label: "カバー画像",
    },
    {
      name: "featureModels",
      type: "relationship",
      relationTo: "models",
      hasMany: true,
      label: "掲載モデル",
    },
    {
      name: "prices",
      type: "array",
      label: "価格情報",
      fields: [
        {
          name: "partner",
          type: "select",
          options: [
            { label: "Amazon", value: "amazon" },
            { label: "楽天ブックス", value: "rakuten" },
            { label: "FANZA", value: "fanza" },
          ],
        },
        { name: "url", type: "text", label: "アフィリエイトURL" },
        { name: "price", type: "number", label: "価格 (税込)" },
        { name: "pointBonus", type: "number", label: "ポイント還元" },
        {
          name: "stock",
          type: "select",
          options: [
            { label: "在庫あり", value: "ok" },
            { label: "残り少ない", value: "low" },
            { label: "在庫なし", value: "out" },
          ],
          defaultValue: "ok",
        },
        { name: "shipping", type: "text", label: "配送情報" },
        { name: "recommended", type: "checkbox", label: "おすすめ", defaultValue: false },
        { name: "pricesUpdatedAt", type: "date", label: "価格更新日時" },
      ],
    },
    {
      name: "toc",
      type: "array",
      label: "目次",
      fields: [
        { name: "pageNum", type: "number", label: "ページ" },
        { name: "tag", type: "text", label: "タグ (例: 巻頭/特集)" },
        { name: "content", type: "text", label: "内容" },
        { name: "meta", type: "text", label: "メタ情報" },
      ],
    },
    {
      name: "specs",
      type: "array",
      label: "基本情報",
      fields: [
        { name: "key", type: "text" },
        { name: "value", type: "text" },
      ],
    },
    {
      name: "badge",
      type: "select",
      label: "バッジ",
      options: [
        { label: "新刊", value: "new" },
        { label: "予約", value: "preorder" },
        { label: "復刻", value: "reissue" },
      ],
    },
  ],
};

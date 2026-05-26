import type { CollectionConfig } from "payload";

export const Features: CollectionConfig = {
  slug: "features",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "category", "author", "publishedAt", "status"],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      label: "タイトル",
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
      name: "category",
      type: "select",
      label: "カテゴリ",
      options: [
        { label: "解説", value: "解説" },
        { label: "インタビュー", value: "インタビュー" },
        { label: "特集", value: "特集" },
        { label: "レビュー", value: "レビュー" },
        { label: "ガイド", value: "ガイド" },
      ],
    },
    {
      name: "lede",
      type: "textarea",
      label: "リード文",
    },
    {
      name: "author",
      type: "text",
      label: "著者",
    },
    {
      name: "readTime",
      type: "number",
      label: "読了時間 (分)",
    },
    {
      name: "publishedAt",
      type: "date",
      label: "公開日",
      admin: { position: "sidebar" },
    },
    {
      name: "heroImage",
      type: "upload",
      relationTo: "media",
      label: "ヘッダー画像",
    },
    {
      name: "body",
      type: "richText",
      label: "本文",
    },
    {
      name: "tags",
      type: "array",
      label: "タグ",
      fields: [{ name: "tag", type: "text" }],
    },
    {
      name: "relatedMagazines",
      type: "relationship",
      relationTo: "magazines",
      hasMany: true,
      label: "関連雑誌・写真集",
    },
    {
      name: "relatedFeatures",
      type: "relationship",
      relationTo: "features",
      hasMany: true,
      label: "関連記事",
    },
  ],
};

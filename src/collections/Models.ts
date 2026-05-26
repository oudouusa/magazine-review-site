import type { CollectionConfig } from "payload";

export const Models: CollectionConfig = {
  slug: "models",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "nameYomi", "agency", "status", "updatedAt"],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      label: "名前",
    },
    {
      name: "nameYomi",
      type: "text",
      required: true,
      label: "よみがな",
    },
    {
      name: "nameRomaji",
      type: "text",
      label: "ローマ字",
    },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      options: [
        { label: "下書き", value: "draft" },
        { label: "公開", value: "published" },
      ],
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "birthdate",
      type: "date",
      label: "生年月日",
    },
    {
      name: "birthplace",
      type: "text",
      label: "出身地",
    },
    {
      name: "height",
      type: "number",
      label: "身長 (cm)",
    },
    {
      name: "bwh",
      type: "text",
      label: "BWH (例: B87 W58 H86)",
    },
    {
      name: "bloodType",
      type: "select",
      label: "血液型",
      options: ["A", "B", "O", "AB"].map((v) => ({ label: v, value: v })),
    },
    {
      name: "hobbies",
      type: "array",
      label: "趣味",
      fields: [{ name: "hobby", type: "text" }],
    },
    {
      name: "agency",
      type: "text",
      label: "所属",
    },
    {
      name: "debutDate",
      type: "date",
      label: "デビュー日",
    },
    {
      name: "debutMagazine",
      type: "text",
      label: "デビュー誌",
    },
    {
      name: "tags",
      type: "array",
      label: "タグ",
      fields: [{ name: "tag", type: "text" }],
    },
    {
      name: "lede",
      type: "textarea",
      label: "紹介文",
    },
    {
      name: "portraitGradient",
      type: "group",
      label: "ポートレートグラデーション",
      fields: [
        { name: "c1", type: "text", defaultValue: "#f5d8c8" },
        { name: "c2", type: "text", defaultValue: "#e8c2cc" },
        { name: "c3", type: "text", defaultValue: "#f1d9d2" },
        { name: "c4", type: "text", defaultValue: "#d4a8b2" },
      ],
    },
    {
      name: "portraitImage",
      type: "upload",
      relationTo: "media",
      label: "ポートレート画像",
    },
    {
      name: "stats",
      type: "group",
      label: "統計",
      fields: [
        { name: "issues", type: "number", defaultValue: 0, label: "出演誌数" },
        { name: "photobooks", type: "number", defaultValue: 0, label: "写真集数" },
        { name: "covers", type: "number", defaultValue: 0, label: "表紙回数" },
        { name: "favorites", type: "number", defaultValue: 0, label: "お気に入り数" },
        { name: "monthlyRank", type: "number", label: "今月ランキング" },
      ],
    },
    {
      name: "relatedModels",
      type: "relationship",
      relationTo: "models",
      hasMany: true,
      label: "関連モデル",
    },
  ],
};

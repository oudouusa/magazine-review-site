/* tslint:disable */
/* eslint-disable */
/**
 * This file was manually created as a stub.
 * Run `npx payload generate:types` to regenerate (requires Node.js with tsx v3 compatibility).
 */

export interface Config {
  auth: {
    users: {
      fields: UsersFields;
    };
  };
  collections: {
    users: User;
    models: Model;
    magazines: Magazine;
    features: Feature;
    media: Media;
  };
  db: {
    defaultIDType: number;
  };
  globals: Record<string, never>;
  locale: null;
  user: User & {
    collection: "users";
  };
  collectionsJoins: Record<string, never>;
  collectionsSelect: Record<string, never>;
  globalsSelect: Record<string, never>;
  jobs: {
    tasks: Record<string, never>;
    workflows: Record<string, never>;
  };
}

export interface User {
  id: number;
  email: string;
  password: string;
  resetPasswordToken?: string | null;
  resetPasswordExpiration?: string | null;
  salt?: string | null;
  hash?: string | null;
  loginAttempts?: number | null;
  lockUntil?: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface Model {
  id: number;
  slug: string;
  name: string;
  nameYomi?: string | null;
  nameRomaji?: string | null;
  birthdate?: string | null;
  height?: number | null;
  tags?: string[] | null;
  stats?: {
    issues?: number | null;
    photobooks?: number | null;
    covers?: number | null;
    favorites?: number | null;
    monthlyRank?: number | null;
  };
  portraitGradient?: {
    c1?: string | null;
    c2?: string | null;
    c3?: string | null;
    c4?: string | null;
  };
  relatedModels?: (number | Model)[] | null;
  updatedAt: string;
  createdAt: string;
}

export interface Magazine {
  id: number;
  slug: string;
  title: string;
  seriesName?: string | null;
  issue?: string | null;
  type?: ("weekly" | "monthly" | "photobook" | "digital-only" | "reissue" | "limited") | null;
  publisher?: string | null;
  releaseDate?: string | null;
  description?: unknown;
  prices?: {
    partner?: string | null;
    url?: string | null;
    price?: number | null;
    pointBonus?: number | null;
    stock?: ("ok" | "low" | "out") | null;
    shipping?: string | null;
    recommended?: boolean | null;
    id?: string | null;
  }[] | null;
  featuredModels?: (number | Model)[] | null;
  gradient?: {
    c1?: string | null;
    c2?: string | null;
  };
  toc?: {
    page?: string | null;
    tag?: string | null;
    content?: string | null;
    meta?: string | null;
    id?: string | null;
  }[] | null;
  specs?: {
    label?: string | null;
    value?: string | null;
    id?: string | null;
  }[] | null;
  badge?: ("new" | "preorder" | "reissue") | null;
  updatedAt: string;
  createdAt: string;
}

export interface Feature {
  id: number;
  slug: string;
  title: string;
  lede?: string | null;
  category?: string | null;
  author?: string | null;
  date?: string | null;
  body?: unknown;
  relatedMagazines?: (number | Magazine)[] | null;
  gradient?: {
    c1?: string | null;
    c2?: string | null;
  };
  updatedAt: string;
  createdAt: string;
}

export interface Media {
  id: number;
  alt?: string | null;
  updatedAt: string;
  createdAt: string;
  url?: string | null;
  thumbnailURL?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  filesize?: number | null;
  width?: number | null;
  height?: number | null;
  focalX?: number | null;
  focalY?: number | null;
}

export type UsersFields = {
  email: unknown;
  password: unknown;
};

declare module "payload" {
  // @ts-ignore
  export interface GeneratedTypes extends Config {}
}

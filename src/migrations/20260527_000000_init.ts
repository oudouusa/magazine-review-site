import type { MigrateDownArgs, MigrateUpArgs } from "@payloadcms/db-sqlite";
import { sql } from "@payloadcms/db-sqlite";

export const name = "20260527_000000_init";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  // Payload internal: migrations tracking
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS "payload_migrations" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "name" text,
      "batch" numeric,
      "created_at" text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      "updated_at" text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
    )
  `);

  // Payload internal: user preferences
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS "payload_preferences" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "key" text,
      "value" text,
      "created_at" text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      "updated_at" text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS "payload_preferences_rels" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL REFERENCES "payload_preferences"("id") ON DELETE cascade,
      "path" text NOT NULL,
      "users_id" integer REFERENCES "users"("id") ON DELETE cascade
    )
  `);

  // Users collection (auth enabled)
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS "users" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "name" text,
      "updated_at" text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      "created_at" text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      "email" text NOT NULL,
      "reset_password_token" text,
      "reset_password_expiration" text,
      "salt" text,
      "hash" text,
      "login_attempts" numeric DEFAULT 0,
      "lock_until" text
    )
  `);

  await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email")`);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS "users_sessions" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL REFERENCES "users"("id") ON DELETE cascade,
      "id" text PRIMARY KEY NOT NULL,
      "created_at" text,
      "expires_at" text
    )
  `);

  // Media collection
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS "media" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "alt" text NOT NULL,
      "updated_at" text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      "created_at" text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      "url" text,
      "thumbnail_u_r_l" text,
      "filename" text,
      "mime_type" text,
      "filesize" numeric,
      "width" numeric,
      "height" numeric,
      "focal_x" numeric,
      "focal_y" numeric
    )
  `);

  // Models collection
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS "models" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "name" text NOT NULL,
      "name_yomi" text NOT NULL,
      "name_romaji" text,
      "slug" text NOT NULL,
      "status" text DEFAULT 'draft',
      "birthdate" text,
      "birthplace" text,
      "height" numeric,
      "bwh" text,
      "blood_type" text,
      "agency" text,
      "debut_date" text,
      "debut_magazine" text,
      "lede" text,
      "portrait_gradient_c1" text DEFAULT '#f5d8c8',
      "portrait_gradient_c2" text DEFAULT '#e8c2cc',
      "portrait_gradient_c3" text DEFAULT '#f1d9d2',
      "portrait_gradient_c4" text DEFAULT '#d4a8b2',
      "portrait_image_id" integer REFERENCES "media"("id") ON DELETE set null,
      "stats_issues" numeric DEFAULT 0,
      "stats_photobooks" numeric DEFAULT 0,
      "stats_covers" numeric DEFAULT 0,
      "stats_favorites" numeric DEFAULT 0,
      "stats_monthly_rank" numeric,
      "updated_at" text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      "created_at" text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
    )
  `);

  await db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS "models_slug_idx" ON "models" ("slug")`);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS "models_hobbies" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL REFERENCES "models"("id") ON DELETE cascade,
      "id" text PRIMARY KEY NOT NULL,
      "hobby" text
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS "models_tags" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL REFERENCES "models"("id") ON DELETE cascade,
      "id" text PRIMARY KEY NOT NULL,
      "tag" text
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS "models_rels" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL REFERENCES "models"("id") ON DELETE cascade,
      "path" text NOT NULL,
      "models_id" integer REFERENCES "models"("id") ON DELETE cascade
    )
  `);

  // Magazines collection
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS "magazines" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "title" text NOT NULL,
      "slug" text NOT NULL,
      "status" text DEFAULT 'draft',
      "type" text NOT NULL,
      "publisher" text,
      "series_name" text,
      "issue" text,
      "release_date" text NOT NULL,
      "sub_title" text,
      "pages" numeric,
      "format" text,
      "isbn" text,
      "jan" text,
      "cover_gradient_c1" text DEFAULT '#dccfb8',
      "cover_gradient_c2" text DEFAULT '#9a8b6b',
      "cover_image_id" integer REFERENCES "media"("id") ON DELETE set null,
      "badge" text,
      "updated_at" text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      "created_at" text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
    )
  `);

  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS "magazines_slug_idx" ON "magazines" ("slug")`,
  );

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS "magazines_prices" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL REFERENCES "magazines"("id") ON DELETE cascade,
      "id" text PRIMARY KEY NOT NULL,
      "partner" text,
      "url" text,
      "price" numeric,
      "point_bonus" numeric,
      "stock" text DEFAULT 'ok',
      "shipping" text,
      "recommended" numeric DEFAULT false,
      "prices_updated_at" text
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS "magazines_toc" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL REFERENCES "magazines"("id") ON DELETE cascade,
      "id" text PRIMARY KEY NOT NULL,
      "page_num" numeric,
      "tag" text,
      "content" text,
      "meta" text
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS "magazines_specs" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL REFERENCES "magazines"("id") ON DELETE cascade,
      "id" text PRIMARY KEY NOT NULL,
      "key" text,
      "value" text
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS "magazines_rels" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL REFERENCES "magazines"("id") ON DELETE cascade,
      "path" text NOT NULL,
      "models_id" integer REFERENCES "models"("id") ON DELETE cascade
    )
  `);

  // Features collection
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS "features" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "title" text NOT NULL,
      "slug" text NOT NULL,
      "status" text DEFAULT 'draft',
      "category" text,
      "lede" text,
      "author" text,
      "read_time" numeric,
      "published_at" text,
      "hero_image_id" integer REFERENCES "media"("id") ON DELETE set null,
      "body" text,
      "updated_at" text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
      "created_at" text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL
    )
  `);

  await db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS "features_slug_idx" ON "features" ("slug")`,
  );

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS "features_tags" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL REFERENCES "features"("id") ON DELETE cascade,
      "id" text PRIMARY KEY NOT NULL,
      "tag" text
    )
  `);

  await db.run(sql`
    CREATE TABLE IF NOT EXISTS "features_rels" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "order" integer,
      "parent_id" integer NOT NULL REFERENCES "features"("id") ON DELETE cascade,
      "path" text NOT NULL,
      "magazines_id" integer REFERENCES "magazines"("id") ON DELETE cascade,
      "features_id" integer REFERENCES "features"("id") ON DELETE cascade
    )
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE IF EXISTS "features_rels"`);
  await db.run(sql`DROP TABLE IF EXISTS "features_tags"`);
  await db.run(sql`DROP TABLE IF EXISTS "features"`);
  await db.run(sql`DROP TABLE IF EXISTS "magazines_rels"`);
  await db.run(sql`DROP TABLE IF EXISTS "magazines_specs"`);
  await db.run(sql`DROP TABLE IF EXISTS "magazines_toc"`);
  await db.run(sql`DROP TABLE IF EXISTS "magazines_prices"`);
  await db.run(sql`DROP TABLE IF EXISTS "magazines"`);
  await db.run(sql`DROP TABLE IF EXISTS "models_rels"`);
  await db.run(sql`DROP TABLE IF EXISTS "models_tags"`);
  await db.run(sql`DROP TABLE IF EXISTS "models_hobbies"`);
  await db.run(sql`DROP TABLE IF EXISTS "models"`);
  await db.run(sql`DROP TABLE IF EXISTS "media"`);
  await db.run(sql`DROP TABLE IF EXISTS "users_sessions"`);
  await db.run(sql`DROP TABLE IF EXISTS "users"`);
  await db.run(sql`DROP TABLE IF EXISTS "payload_preferences_rels"`);
  await db.run(sql`DROP TABLE IF EXISTS "payload_preferences"`);
  await db.run(sql`DROP TABLE IF EXISTS "payload_migrations"`);
}

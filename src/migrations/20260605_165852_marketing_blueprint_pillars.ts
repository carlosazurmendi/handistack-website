import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// Idempotent baseline migration.
//
// The production database was originally built by Payload dev-push, so most of
// this schema already exists there; only the new Marketing "blueprint" / "pillars"
// objects are missing. A fresh database has nothing. This single migration brings
// EITHER state to the full current schema: every statement is guarded
// (IF NOT EXISTS / duplicate_object catch), so it creates only what's absent and
// is safe to run (and re-run) anywhere. It also records the full schema as the
// migration baseline, so subsequent `pnpm migrate:create` runs emit clean deltas.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  -- ---- enums ----
  DO $$ BEGIN CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'editor'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_leads_status" AS ENUM('new', 'researching', 'qualified', 'unqualified', 'booked', 'error'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_bookings_status" AS ENUM('reserved', 'confirmed', 'cancelled'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_posts_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum__posts_v_version_status" AS ENUM('draft', 'published'); EXCEPTION WHEN duplicate_object THEN null; END $$;

  -- ---- tables ----
  CREATE TABLE IF NOT EXISTS "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"role" "enum_users_role" DEFAULT 'editor' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  CREATE TABLE IF NOT EXISTS "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar
  );
  CREATE TABLE IF NOT EXISTS "leads" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"phone" varchar,
  	"domain" varchar NOT NULL,
  	"bottleneck" varchar NOT NULL,
  	"timeline" varchar,
  	"status" "enum_leads_status" DEFAULT 'new' NOT NULL,
  	"research_summary" varchar,
  	"score" numeric,
  	"n8n_raw" jsonb,
  	"source" varchar DEFAULT 'marketing-site',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "bookings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"lead_id" integer NOT NULL,
  	"start_time" timestamp(3) with time zone NOT NULL,
  	"end_time" timestamp(3) with time zone NOT NULL,
  	"slot_label" varchar,
  	"timezone" varchar DEFAULT 'America/New_York',
  	"google_event_id" varchar,
  	"meet_link" varchar,
  	"meet_space_name" varchar,
  	"calendar_id" varchar,
  	"status" "enum_bookings_status" DEFAULT 'reserved' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"excerpt" varchar,
  	"cover_image_id" integer,
  	"author_id" integer,
  	"content" jsonb,
  	"status" "enum_posts_status" DEFAULT 'draft',
  	"published_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_posts_status" DEFAULT 'draft'
  );
  CREATE TABLE IF NOT EXISTS "posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer
  );
  CREATE TABLE IF NOT EXISTS "_posts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_excerpt" varchar,
  	"version_cover_image_id" integer,
  	"version_author_id" integer,
  	"version_content" jsonb,
  	"version_status" "enum__posts_v_version_status" DEFAULT 'draft',
  	"version_published_at" timestamp(3) with time zone,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  CREATE TABLE IF NOT EXISTS "_posts_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer
  );
  CREATE TABLE IF NOT EXISTS "case_studies_stack" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "case_studies" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"number" varchar,
  	"tag" varchar,
  	"title" varchar NOT NULL,
  	"slug" varchar,
  	"problem" varchar NOT NULL,
  	"architecture" varchar NOT NULL,
  	"outcome" varchar NOT NULL,
  	"metric_big" varchar,
  	"metric_sub" varchar,
  	"featured" boolean DEFAULT false,
  	"published" boolean DEFAULT true,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "testimonials" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"quote" varchar NOT NULL,
  	"author_name" varchar NOT NULL,
  	"role" varchar,
  	"company" varchar,
  	"avatar_id" integer,
  	"featured" boolean DEFAULT false,
  	"published" boolean DEFAULT true,
  	"order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"leads_id" integer,
  	"bookings_id" integer,
  	"categories_id" integer,
  	"posts_id" integer,
  	"case_studies_id" integer,
  	"testimonials_id" integer
  );
  CREATE TABLE IF NOT EXISTS "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  CREATE TABLE IF NOT EXISTS "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "marketing_blueprint_tabs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"short" varchar,
  	"title" varchar,
  	"desc" varchar
  );
  CREATE TABLE IF NOT EXISTS "marketing_pillars_tags" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "marketing_pillars" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"h3" varchar NOT NULL,
  	"body" varchar NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "marketing_metrics" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" numeric NOT NULL,
  	"suffix" varchar,
  	"label" varchar NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "marketing_faqs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"q" varchar NOT NULL,
  	"a" varchar NOT NULL
  );
  CREATE TABLE IF NOT EXISTS "marketing" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );

  -- ---- ensure every Marketing column exists (the table predates the new fields) ----
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "hero_eyebrow" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "hero_headline" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "hero_headline_accent" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "hero_sub" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "hero_cta_label" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "hero_trust" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "nav_cta_label" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "cta_title" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "cta_body" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "cta_button" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "blueprint_eyebrow" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "blueprint_title" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "blueprint_title_accent" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "blueprint_body" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "manifesto_kicker" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "manifesto_title" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "manifesto_lead" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "manifesto_body1" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "manifesto_body2" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "arch_eyebrow" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "arch_title" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "arch_body" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "cases_eyebrow" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "cases_title" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "cases_body" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "results_eyebrow" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "results_title" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "results_body" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "faq_eyebrow" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "faq_title" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "faq_body" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "booking_eyebrow" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "booking_title" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "booking_body" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "unqualified_message" varchar DEFAULT 'Thanks for reaching out! We''ll contact you regarding your request soon.';
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "footer_tagline" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "contact_email" varchar;
  ALTER TABLE "marketing" ADD COLUMN IF NOT EXISTS "footer_copyright" varchar;

  -- ---- foreign keys (guarded; skip if already present) ----
  DO $$ BEGIN ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "bookings" ADD CONSTRAINT "bookings_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "posts" ADD CONSTRAINT "posts_cover_image_id_media_id_fk" FOREIGN KEY ("cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_cover_image_id_media_id_fk" FOREIGN KEY ("version_cover_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_author_id_users_id_fk" FOREIGN KEY ("version_author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "case_studies_stack" ADD CONSTRAINT "case_studies_stack_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_avatar_id_media_id_fk" FOREIGN KEY ("avatar_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_leads_fk" FOREIGN KEY ("leads_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_bookings_fk" FOREIGN KEY ("bookings_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_case_studies_fk" FOREIGN KEY ("case_studies_id") REFERENCES "public"."case_studies"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_testimonials_fk" FOREIGN KEY ("testimonials_id") REFERENCES "public"."testimonials"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "marketing_blueprint_tabs" ADD CONSTRAINT "marketing_blueprint_tabs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "marketing_pillars_tags" ADD CONSTRAINT "marketing_pillars_tags_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing_pillars"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "marketing_pillars" ADD CONSTRAINT "marketing_pillars_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "marketing_metrics" ADD CONSTRAINT "marketing_metrics_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "marketing_faqs" ADD CONSTRAINT "marketing_faqs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."marketing"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;

  -- ---- indexes ----
  CREATE INDEX IF NOT EXISTS "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX IF NOT EXISTS "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX IF NOT EXISTS "media_sizes_hero_sizes_hero_filename_idx" ON "media" USING btree ("sizes_hero_filename");
  CREATE INDEX IF NOT EXISTS "leads_email_idx" ON "leads" USING btree ("email");
  CREATE INDEX IF NOT EXISTS "leads_status_idx" ON "leads" USING btree ("status");
  CREATE INDEX IF NOT EXISTS "leads_updated_at_idx" ON "leads" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "leads_created_at_idx" ON "leads" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "bookings_lead_idx" ON "bookings" USING btree ("lead_id");
  CREATE INDEX IF NOT EXISTS "bookings_google_event_id_idx" ON "bookings" USING btree ("google_event_id");
  CREATE INDEX IF NOT EXISTS "bookings_updated_at_idx" ON "bookings" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "bookings_created_at_idx" ON "bookings" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "posts_slug_idx" ON "posts" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "posts_cover_image_idx" ON "posts" USING btree ("cover_image_id");
  CREATE INDEX IF NOT EXISTS "posts_author_idx" ON "posts" USING btree ("author_id");
  CREATE INDEX IF NOT EXISTS "posts_status_idx" ON "posts" USING btree ("status");
  CREATE INDEX IF NOT EXISTS "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "posts__status_idx" ON "posts" USING btree ("_status");
  CREATE INDEX IF NOT EXISTS "posts_rels_order_idx" ON "posts_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "posts_rels_parent_idx" ON "posts_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "posts_rels_path_idx" ON "posts_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "posts_rels_categories_id_idx" ON "posts_rels" USING btree ("categories_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_parent_idx" ON "_posts_v" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_slug_idx" ON "_posts_v" USING btree ("version_slug");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_cover_image_idx" ON "_posts_v" USING btree ("version_cover_image_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_author_idx" ON "_posts_v" USING btree ("version_author_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_status_idx" ON "_posts_v" USING btree ("version_status");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_updated_at_idx" ON "_posts_v" USING btree ("version_updated_at");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version_created_at_idx" ON "_posts_v" USING btree ("version_created_at");
  CREATE INDEX IF NOT EXISTS "_posts_v_version_version__status_idx" ON "_posts_v" USING btree ("version__status");
  CREATE INDEX IF NOT EXISTS "_posts_v_created_at_idx" ON "_posts_v" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "_posts_v_updated_at_idx" ON "_posts_v" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "_posts_v_latest_idx" ON "_posts_v" USING btree ("latest");
  CREATE INDEX IF NOT EXISTS "_posts_v_rels_order_idx" ON "_posts_v_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "_posts_v_rels_parent_idx" ON "_posts_v_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "_posts_v_rels_path_idx" ON "_posts_v_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "_posts_v_rels_categories_id_idx" ON "_posts_v_rels" USING btree ("categories_id");
  CREATE INDEX IF NOT EXISTS "case_studies_stack_order_idx" ON "case_studies_stack" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "case_studies_stack_parent_id_idx" ON "case_studies_stack" USING btree ("_parent_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "case_studies_slug_idx" ON "case_studies" USING btree ("slug");
  CREATE INDEX IF NOT EXISTS "case_studies_updated_at_idx" ON "case_studies" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "case_studies_created_at_idx" ON "case_studies" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "testimonials_avatar_idx" ON "testimonials" USING btree ("avatar_id");
  CREATE INDEX IF NOT EXISTS "testimonials_updated_at_idx" ON "testimonials" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "testimonials_created_at_idx" ON "testimonials" USING btree ("created_at");
  CREATE UNIQUE INDEX IF NOT EXISTS "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_leads_id_idx" ON "payload_locked_documents_rels" USING btree ("leads_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_bookings_id_idx" ON "payload_locked_documents_rels" USING btree ("bookings_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_case_studies_id_idx" ON "payload_locked_documents_rels" USING btree ("case_studies_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_testimonials_id_idx" ON "payload_locked_documents_rels" USING btree ("testimonials_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX IF NOT EXISTS "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX IF NOT EXISTS "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX IF NOT EXISTS "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "marketing_blueprint_tabs_order_idx" ON "marketing_blueprint_tabs" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "marketing_blueprint_tabs_parent_id_idx" ON "marketing_blueprint_tabs" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "marketing_pillars_tags_order_idx" ON "marketing_pillars_tags" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "marketing_pillars_tags_parent_id_idx" ON "marketing_pillars_tags" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "marketing_pillars_order_idx" ON "marketing_pillars" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "marketing_pillars_parent_id_idx" ON "marketing_pillars" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "marketing_metrics_order_idx" ON "marketing_metrics" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "marketing_metrics_parent_id_idx" ON "marketing_metrics" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "marketing_faqs_order_idx" ON "marketing_faqs" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "marketing_faqs_parent_id_idx" ON "marketing_faqs" USING btree ("_parent_id");`)
}

// Conservative rollback: only the objects this migration actually adds to the
// existing production database (the new Marketing blueprint/pillars tables and
// columns). It deliberately does NOT drop the rest of the schema — running
// `migrate:down` must never wipe a live database. For a full teardown of a
// throwaway dev DB, use `payload migrate:fresh`.
export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE IF EXISTS "marketing_blueprint_tabs" CASCADE;
  DROP TABLE IF EXISTS "marketing_pillars_tags" CASCADE;
  DROP TABLE IF EXISTS "marketing_pillars" CASCADE;
  ALTER TABLE "marketing" DROP COLUMN IF EXISTS "blueprint_eyebrow";
  ALTER TABLE "marketing" DROP COLUMN IF EXISTS "blueprint_title";
  ALTER TABLE "marketing" DROP COLUMN IF EXISTS "blueprint_title_accent";
  ALTER TABLE "marketing" DROP COLUMN IF EXISTS "blueprint_body";
  ALTER TABLE "marketing" DROP COLUMN IF EXISTS "manifesto_kicker";
  ALTER TABLE "marketing" DROP COLUMN IF EXISTS "manifesto_title";
  ALTER TABLE "marketing" DROP COLUMN IF EXISTS "manifesto_lead";
  ALTER TABLE "marketing" DROP COLUMN IF EXISTS "manifesto_body1";
  ALTER TABLE "marketing" DROP COLUMN IF EXISTS "manifesto_body2";
  ALTER TABLE "marketing" DROP COLUMN IF EXISTS "arch_eyebrow";
  ALTER TABLE "marketing" DROP COLUMN IF EXISTS "arch_title";
  ALTER TABLE "marketing" DROP COLUMN IF EXISTS "arch_body";
  ALTER TABLE "marketing" DROP COLUMN IF EXISTS "cases_eyebrow";
  ALTER TABLE "marketing" DROP COLUMN IF EXISTS "cases_title";
  ALTER TABLE "marketing" DROP COLUMN IF EXISTS "cases_body";
  ALTER TABLE "marketing" DROP COLUMN IF EXISTS "footer_copyright";`)
}

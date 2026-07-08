import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "consent" boolean DEFAULT false;
  ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "consent_at" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "leads" DROP COLUMN IF EXISTS "consent";
  ALTER TABLE "leads" DROP COLUMN IF EXISTS "consent_at";`)
}

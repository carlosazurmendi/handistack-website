import path from 'path'
import { fileURLToPath } from 'url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'

import { gmailEmailAdapter } from './lib/emailAdapter'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Leads } from './collections/Leads'
import { Bookings } from './collections/Bookings'
import { Categories } from './collections/Categories'
import { Posts } from './collections/Posts'
import { CaseStudies } from './collections/CaseStudies'
import { Testimonials } from './collections/Testimonials'
import { Marketing } from './globals/Marketing'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const serverURL =
  process.env.APP_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

// Supabase Storage (S3-compatible) for media — enabled only when S3 keys are
// present; otherwise media stays on the local disk / mounted volume.
const supabaseS3Enabled = Boolean(
  process.env.SUPABASE_S3_ACCESS_KEY_ID && process.env.SUPABASE_S3_SECRET_ACCESS_KEY && process.env.SUPABASE_S3_ENDPOINT,
)

const storagePlugins = supabaseS3Enabled
  ? [
      s3Storage({
        collections: {
          media: {
            // Serve files straight from the public Supabase bucket (CDN), not via the app.
            generateFileURL: ({ filename, prefix }) => {
              const base = (process.env.SUPABASE_URL || '').replace(/\/$/, '')
              const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'media'
              const key = [prefix, filename].filter(Boolean).join('/')
              return `${base}/storage/v1/object/public/${bucket}/${key}`
            },
          },
        },
        bucket: process.env.SUPABASE_STORAGE_BUCKET || 'media',
        config: {
          endpoint: process.env.SUPABASE_S3_ENDPOINT as string,
          region: process.env.SUPABASE_S3_REGION || 'us-east-1',
          forcePathStyle: true, // required by Supabase Storage
          credentials: {
            accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY_ID as string,
            secretAccessKey: process.env.SUPABASE_S3_SECRET_ACCESS_KEY as string,
          },
        },
      }),
    ]
  : []

export default buildConfig({
  serverURL,
  email: gmailEmailAdapter,
  plugins: storagePlugins,
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '— Handistack Admin',
    },
  },
  editor: lexicalEditor(),
  collections: [Users, Media, Leads, Bookings, Categories, Posts, CaseStudies, Testimonials],
  globals: [Marketing],
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
      // Supabase requires TLS; the pooler cert chain isn't in the default store.
      ssl: { rejectUnauthorized: false },
    },
    // Auto-sync schema by default (simplest first deploy). Set PAYLOAD_DB_PUSH=false
    // and use `payload migrate` once the schema stabilizes in production.
    push: process.env.PAYLOAD_DB_PUSH !== 'false',
  }),
  sharp,
  cors: [serverURL, `https://${process.env.ADMIN_HOST || ''}`].filter(Boolean),
  csrf: [serverURL, `https://${process.env.ADMIN_HOST || ''}`].filter(Boolean),
})

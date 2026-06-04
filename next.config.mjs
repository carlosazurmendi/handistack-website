import { withPayload } from '@payloadcms/next/withPayload'
import { fileURLToPath } from 'url'
import path from 'path'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output so the Docker image stays small (pulled via Dockhand on the GCP VPS).
  output: 'standalone',
  // Pin the workspace root (a stray lockfile in the home dir otherwise confuses Next).
  turbopack: { root: dirname },
  outputFileTracingRoot: dirname,
  reactStrictMode: true,
  images: {
    // Allow serving media from the public Supabase Storage bucket.
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.storage.supabase.co' },
    ],
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })

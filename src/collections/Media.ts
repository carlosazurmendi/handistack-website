import type { CollectionConfig } from 'payload'

// Uploads (logos, cover images, testimonial avatars). Stored on local disk by
// default — mount /public/media as a Docker volume in prod, or swap in
// @payloadcms/storage-s3 pointed at a Supabase Storage bucket.
export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Content' },
  access: {
    read: () => true,
  },
  upload: {
    staticDir: 'public/media',
    mimeTypes: ['image/*'],
    imageSizes: [
      { name: 'thumbnail', width: 400 },
      { name: 'card', width: 768 },
      { name: 'hero', width: 1600 },
    ],
  },
  fields: [
    { name: 'alt', type: 'text', required: true, admin: { description: 'Accessibility alt text.' } },
  ],
}

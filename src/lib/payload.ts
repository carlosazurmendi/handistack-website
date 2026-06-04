import { getPayload as getPayloadInstance } from 'payload'
import config from '@payload-config'

// Cache the Payload instance across hot reloads / requests in a single process.
let cached: Awaited<ReturnType<typeof getPayloadInstance>> | null = null

export async function getPayloadClient() {
  if (cached) return cached
  cached = await getPayloadInstance({ config })
  return cached
}

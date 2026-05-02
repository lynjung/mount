import { createClerkClient } from '@clerk/backend'

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

export async function getUserId(req) {
  const token = req.headers['authorization']?.replace('Bearer ', '')
  if (!token) return null
  try {
    const payload = await clerk.verifyToken(token)
    return payload.sub
  } catch {
    return null
  }
}

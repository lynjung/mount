import sql from './_db.js'
import { getUserId } from './_auth.js'

export default async function handler(req, res) {
  const userId = await getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const accounts = await sql`
      SELECT id, name, type, currency, balance::float, color, created_at
      FROM accounts WHERE user_id = ${userId} ORDER BY created_at ASC
    `
    return res.status(200).json(accounts)
  }

  if (req.method === 'POST') {
    const { id, name, type, currency, balance, color } = req.body
    const [account] = await sql`
      INSERT INTO accounts (id, name, type, currency, balance, color, user_id)
      VALUES (${id}, ${name}, ${type}, ${currency}, ${balance}, ${color}, ${userId})
      RETURNING id, name, type, currency, balance::float, color, created_at
    `
    return res.status(201).json(account)
  }

  if (req.method === 'PATCH') {
    const { id, balance } = req.body
    const [account] = await sql`
      UPDATE accounts SET balance = ${balance}
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id, name, type, currency, balance::float, color, created_at
    `
    return res.status(200).json(account)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

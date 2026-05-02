import sql from './_db.js'
import { getUserId } from './_auth.js'

export default async function handler(req, res) {
  const userId = await getUserId(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const goals = await sql`
      SELECT id, name, emoji, target_amount::float, currency,
             saved_amount::float, account_id, target_date::text, created_at
      FROM goals WHERE user_id = ${userId} ORDER BY created_at ASC
    `
    return res.status(200).json(goals.map(g => ({
      id: g.id, name: g.name, emoji: g.emoji, targetAmount: g.target_amount,
      currency: g.currency, savedAmount: g.saved_amount,
      accountId: g.account_id, targetDate: g.target_date,
    })))
  }

  if (req.method === 'POST') {
    const { id, name, emoji, targetAmount, currency, savedAmount, accountId, targetDate } = req.body
    const [goal] = await sql`
      INSERT INTO goals (id, name, emoji, target_amount, currency, saved_amount, account_id, target_date, user_id)
      VALUES (${id}, ${name}, ${emoji}, ${targetAmount}, ${currency}, ${savedAmount}, ${accountId ?? null}, ${targetDate ?? null}, ${userId})
      RETURNING id, name, emoji, target_amount::float, currency, saved_amount::float, account_id, target_date::text
    `
    return res.status(201).json({
      id: goal.id, name: goal.name, emoji: goal.emoji, targetAmount: goal.target_amount,
      currency: goal.currency, savedAmount: goal.saved_amount,
      accountId: goal.account_id, targetDate: goal.target_date,
    })
  }

  if (req.method === 'PATCH') {
    const { id, savedAmount } = req.body
    const [goal] = await sql`
      UPDATE goals SET saved_amount = ${savedAmount}
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING id, name, emoji, target_amount::float, currency, saved_amount::float, account_id, target_date::text
    `
    return res.status(200).json({
      id: goal.id, name: goal.name, emoji: goal.emoji, targetAmount: goal.target_amount,
      currency: goal.currency, savedAmount: goal.saved_amount,
      accountId: goal.account_id, targetDate: goal.target_date,
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

import sql from './_db.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const transactions = await sql`
      SELECT id, account_id, name, amount::float, type, currency,
             category, date::text, recurring, note, created_at
      FROM transactions ORDER BY date DESC, created_at DESC
    `
    // Convert snake_case to camelCase for frontend compatibility
    return res.status(200).json(transactions.map(t => ({
      id: t.id,
      accountId: t.account_id,
      name: t.name,
      amount: t.amount,
      type: t.type,
      currency: t.currency,
      category: t.category,
      date: t.date,
      recurring: t.recurring,
      note: t.note,
    })))
  }

  if (req.method === 'POST') {
    const { id, accountId, name, amount, type, currency, category, date, recurring, note } = req.body

    // Atomically insert transaction and update account balance
    const delta = type === 'expense' ? -amount : amount
    const [transaction] = await sql`
      WITH inserted AS (
        INSERT INTO transactions (id, account_id, name, amount, type, currency, category, date, recurring, note)
        VALUES (${id}, ${accountId}, ${name}, ${amount}, ${type}, ${currency}, ${category}, ${date}, ${recurring}, ${note ?? ''})
        RETURNING *
      ),
      updated AS (
        UPDATE accounts
        SET balance = balance + ${delta}
        WHERE id = ${accountId}
      )
      SELECT id, account_id, name, amount::float, type, currency,
             category, date::text, recurring, note FROM inserted
    `

    return res.status(201).json({
      id: transaction.id,
      accountId: transaction.account_id,
      name: transaction.name,
      amount: transaction.amount,
      type: transaction.type,
      currency: transaction.currency,
      category: transaction.category,
      date: transaction.date,
      recurring: transaction.recurring,
      note: transaction.note,
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

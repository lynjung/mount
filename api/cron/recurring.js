import sql from '../_db.js'

// Runs daily. Finds recurring transactions from the previous month
// and inserts them into the current month if not already present.
// Idempotency: checks for an existing transaction with the same
// account_id + name + category in the current month before inserting.
export default async function handler(req, res) {
  if (req.headers['authorization'] !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const today = new Date()
  const thisMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const prevDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const lastMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

  // Find all recurring transactions from last month
  const templates = await sql`
    SELECT * FROM transactions
    WHERE recurring = true
    AND to_char(date, 'YYYY-MM') = ${lastMonth}
  `

  let inserted = 0
  for (const tx of templates) {
    // Check if already inserted this month (idempotency)
    const [existing] = await sql`
      SELECT id FROM transactions
      WHERE user_id = ${tx.user_id}
      AND account_id = ${tx.account_id}
      AND name = ${tx.name}
      AND category = ${tx.category}
      AND to_char(date, 'YYYY-MM') = ${thisMonth}
    `
    if (existing) continue

    const newDate = tx.date.toISOString().slice(0, 10).replace(/\d{4}-\d{2}/, thisMonth)
    const newId = crypto.randomUUID()

    await sql`
      WITH inserted AS (
        INSERT INTO transactions (id, account_id, name, amount, type, currency, category, date, recurring, note, user_id)
        VALUES (${newId}, ${tx.account_id}, ${tx.name}, ${tx.amount}, ${tx.type}, ${tx.currency}, ${tx.category}, ${newDate}, true, ${tx.note}, ${tx.user_id})
        RETURNING *
      ),
      updated AS (
        UPDATE accounts
        SET balance = balance + ${tx.type === 'expense' ? -tx.amount : tx.amount}
        WHERE id = ${tx.account_id} AND user_id = ${tx.user_id}
      )
      SELECT id FROM inserted
    `
    inserted++
  }

  return res.status(200).json({ inserted, checked: templates.length })
}

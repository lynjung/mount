import sql from './_db.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const accounts = await sql`
      SELECT id, name, type, currency, balance::float, color, created_at
      FROM accounts ORDER BY created_at ASC
    `
    return res.status(200).json(accounts)
  }

  if (req.method === 'POST') {
    const { id, name, type, currency, balance, color } = req.body
    const [account] = await sql`
      INSERT INTO accounts (id, name, type, currency, balance, color)
      VALUES (${id}, ${name}, ${type}, ${currency}, ${balance}, ${color})
      RETURNING id, name, type, currency, balance::float, color, created_at
    `
    return res.status(201).json(account)
  }

  if (req.method === 'PATCH') {
    const { id, balance } = req.body
    const [account] = await sql`
      UPDATE accounts SET balance = ${balance}
      WHERE id = ${id}
      RETURNING id, name, type, currency, balance::float, color, created_at
    `
    return res.status(200).json(account)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

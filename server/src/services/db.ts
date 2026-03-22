import mysql, { Pool, PoolConnection, ResultSetHeader } from 'mysql2/promise'

let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host:               process.env.DB_HOST     || 'localhost',
      port:               parseInt(process.env.DB_PORT || '3306'),
      user:               process.env.DB_USER     || 'root',
      password:           process.env.DB_PASS     || '',
      database:           process.env.DB_NAME     || 'ai_code_review',
      waitForConnections: true,
      connectionLimit:    10,
      queueLimit:         0,
      timezone:           'local',
      charset:            'utf8mb4',
    })
  }
  return pool
}

type QueryParams = (string | number | boolean | null | Date | Buffer)[]

export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: QueryParams
): Promise<T[]> {
  const [rows] = await getPool().execute(sql, params)
  return rows as T[]
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params?: QueryParams
): Promise<T | null> {
  const rows = await query<T>(sql, params)
  return rows[0] ?? null
}

export async function execute(
  sql: string,
  params?: QueryParams
): Promise<{ affectedRows: number; insertId: number }> {
  const [result] = await getPool().execute(sql, params)
  const r = result as ResultSetHeader
  return { affectedRows: r.affectedRows, insertId: r.insertId }
}

export async function transaction<T>(
  fn: (conn: PoolConnection) => Promise<T>
): Promise<T> {
  const conn = await getPool().getConnection()
  try {
    await conn.beginTransaction()
    const result = await fn(conn)
    await conn.commit()
    return result
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

export async function testConnection(): Promise<void> {
  try {
    await query('SELECT 1')
    console.log('✅ Database connected')
  } catch (err) {
    console.error('❌ Database connection failed:', err)
    process.exit(1)
  }
}

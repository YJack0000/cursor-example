import { Pool } from 'pg'

export const db = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'landmarks',
  password: 'postgres',
  port: 5432,
}) 
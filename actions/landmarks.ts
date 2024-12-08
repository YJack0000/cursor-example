'use server'

import { db } from '@/lib/db'
import { Landmark } from '@/types/landmarks'

export async function getLandmarks(): Promise<Landmark[]> {
  try {
    const result = await db.query(`
      SELECT 
        name as "名稱",
        address as "地址",
        longitude as "經度",
        latitude as "緯度",
        types as "類型"
      FROM properties
      ORDER BY name ASC
    `)
    
    return result.rows
  } catch (error) {
    console.error('Database error:', error)
    throw new Error('Failed to fetch landmarks')
  }
} 
'use server'

import { db } from '@/lib/db'
import { Landmark } from '@/types/landmarks'

export interface PolygonPoint {
  lat: number;
  lng: number;
}

export async function getLandmarksInPolygon(points: PolygonPoint[]): Promise<Landmark[]> {
  if (!points?.length) {
    return getLandmarks();
  }

  try {
    // 構建多邊形的 WKT (Well-Known Text) 表示
    // Make sure to properly format the polygon points and close the polygon
    const polygonPoints = points
      .map(p => `${p.lng} ${p.lat}`)
      .join(',');
    
    // Add the first point again to close the polygon
    const firstPoint = points[0];
    const closedPolygonPoints = `${polygonPoints},${firstPoint.lng} ${firstPoint.lat}`;
    
    const result = await db.query(`
      SELECT 
        name as "名稱",
        address as "地址",
        longitude as "經度",
        latitude as "緯度",
        types as "類型"
      FROM properties
      WHERE ST_Contains(
        ST_GeomFromText('POLYGON((${closedPolygonPoints}))', 4326),
        geom
      )
      ORDER BY name ASC
    `);
    
    return result.rows;
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to fetch landmarks in polygon');
  }
}

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
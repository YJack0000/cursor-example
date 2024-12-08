'use client'

import { useState } from 'react'
import { getLandmarksInPolygon, PolygonPoint } from '@/actions/landmarks'
import { LandmarksTable } from "@/components/landmarks/landmarks-table"
import { LandmarksMap } from "@/components/landmarks/landmarks-map"
import type { Landmark } from '@/types/landmarks'

export default function LandmarksPage() {
  const [landmarks, setLandmarks] = useState<Landmark[]>([])

  const onPolygonChange = async (points: PolygonPoint[] | null) => {
    if (points) {
      const filteredLandmarks = await getLandmarksInPolygon(points)
      setLandmarks(filteredLandmarks)
    } else {
      setLandmarks([])
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">地標列表</h1>
      <div className="space-y-6">
        <LandmarksMap 
          landmarks={landmarks} 
          onPolygonChange={onPolygonChange} 
        />
        <LandmarksTable data={landmarks} />
      </div>
    </div>
  )
}
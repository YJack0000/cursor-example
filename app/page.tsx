import { getLandmarks } from '@/actions/landmarks'
import { LandmarksTable } from "@/components/landmarks/landmarks-table"
import { LandmarksMap } from "@/components/landmarks/landmarks-map"

export default async function LandmarksPage() {
  const landmarks = await getLandmarks()
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">地標列表</h1>
      <div className="space-y-6">
        <LandmarksMap landmarks={landmarks} />
        <LandmarksTable initialData={landmarks} />
      </div>
    </div>
  )
}
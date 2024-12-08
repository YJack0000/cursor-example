import { getLandmarks } from '@/actions/landmarks'
import { LandmarksTable } from "@/components/landmarks/landmarks-table"

export default async function Home() {
  const landmarks = await getLandmarks()
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">地標列表</h1>
      <LandmarksTable initialData={landmarks} />
    </div>
  )
}

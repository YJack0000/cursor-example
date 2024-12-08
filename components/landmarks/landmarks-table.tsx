"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Landmark } from "@/types/landmarks"

interface LandmarksTableProps {
  initialData: Landmark[]
}

export function LandmarksTable({ initialData }: LandmarksTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>名稱</TableHead>
            <TableHead>地址</TableHead>
            <TableHead>經度</TableHead>
            <TableHead>緯度</TableHead>
            <TableHead>類型</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialData.map((landmark, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{landmark.名稱}</TableCell>
              <TableCell>{landmark.地址}</TableCell>
              <TableCell>{landmark.經度}</TableCell>
              <TableCell>{landmark.緯度}</TableCell>
              <TableCell>{landmark.類型.join(', ')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 
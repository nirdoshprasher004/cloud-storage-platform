'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface UsageChartProps {
  data: Array<{
    date: string
    users: number
    files: number
    storage: number
  }>
}

export function UsageChart({ data }: UsageChartProps) {
  return (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Usage Overview</CardTitle>
        <CardDescription>
          Platform usage metrics over the last 30 days
        </CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="users" 
              stroke="#8884d8" 
              strokeWidth={2}
              name="Active Users"
            />
            <Line 
              type="monotone" 
              dataKey="files" 
              stroke="#82ca9d" 
              strokeWidth={2}
              name="Files Uploaded"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
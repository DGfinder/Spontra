'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface DestinationBreakdownChartProps {
  data: Array<{
    destination: string
    earnings: number
  }>
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#ef4444']

export function DestinationBreakdownChart({ data }: DestinationBreakdownChartProps) {
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-xl border border-white/20 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Earnings by Destination</h3>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={(entry: any) => `${entry.destination}: ${(entry.percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="earnings"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0,0,0,0.8)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value: number) => [`$${value.toFixed(2)}`, 'Earnings']}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

"use client"

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

export default function Charts({ data }) {
  const weeklySavings = data?.weekly_savings || [
    { week: "Week 1", savings: 15.2 },
    { week: "Week 2", savings: 22.5 },
    { week: "Week 3", savings: 31.0 },
    { week: "Week 4", savings: 39.0 },
  ]

  const breakdownData = data?.breakdown
    ? Object.entries(data.breakdown).map(([type, info]: any) => ({
        name: type,
        value: info.monthly_savings || 0,
      }))
    : []

  const deletionTimeline = data?.activity || [
    { date: "Nov 21", deleted: 0 },
    { date: "Nov 22", deleted: 1 },
    { date: "Nov 23", deleted: 0 },
    { date: "Nov 24", deleted: 1 },
    { date: "Nov 25", deleted: 1 },
  ]

  const COLORS = ["#64ffda", "#00d9ff", "#00ff88", "#ffd700", "#ff5555"]

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-[#1d2d50] border border-[#64ffda] rounded p-3 font-mono text-sm">
          <p className="text-[#64ffda]">{label || payload[0]?.name}</p>
          <p className="text-[#00ff88]">${payload[0]?.value?.toFixed(2)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Weekly Savings Chart */}
      <div className="terminal-card">
        <h3 className="text-lg font-mono font-bold text-[#64ffda] mb-6">📈 WEEKLY SAVINGS TREND</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={weeklySavings}>
            <CartesianGrid strokeDasharray="3 3" stroke="#233554" />
            <XAxis dataKey="week" stroke="#8892b0" style={{ fontSize: "12px", fontFamily: "monospace" }} />
            <YAxis stroke="#8892b0" style={{ fontSize: "12px", fontFamily: "monospace" }} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="savings"
              stroke="#64ffda"
              strokeWidth={3}
              dot={{ fill: "#64ffda", r: 6 }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Savings Breakdown */}
        <div className="terminal-card">
          <h3 className="text-lg font-mono font-bold text-[#64ffda] mb-6">🥧 SAVINGS BY RESOURCE</h3>
          {breakdownData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={breakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: $${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {breakdownData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-[#8892b0]">No data available</div>
          )}
        </div>

        {/* Deletion Timeline */}
        <div className="terminal-card">
          <h3 className="text-lg font-mono font-bold text-[#64ffda] mb-6">📊 RESOURCES DELETED (30d)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={deletionTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#233554" />
              <XAxis dataKey="date" stroke="#8892b0" style={{ fontSize: "12px", fontFamily: "monospace" }} />
              <YAxis stroke="#8892b0" style={{ fontSize: "12px", fontFamily: "monospace" }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="deleted" fill="#64ffda" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

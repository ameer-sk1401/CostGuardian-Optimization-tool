"use client"

import { useState, useMemo } from "react"
import { Calendar } from "lucide-react"

export default function HistorySection() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  // Generate mock historical data for last 12 months
  const historicalData = useMemo(() => {
    const months = []
    const today = new Date()

    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const monthKey = date.toISOString().slice(0, 7)
      months.push({
        month: date.toLocaleString("default", { month: "long", year: "numeric" }),
        monthKey,
        resourcesDeleted: Math.floor(Math.random() * 8) + 1,
        monthlySavings: Math.floor(Math.random() * 50) + 20,
      })
    }
    return months
  }, [])

  const currentMonthData = historicalData.find((m) => m.monthKey === selectedMonth) || historicalData[0]

  return (
    <div className="terminal-card mt-12">
      <h2 className="text-xl font-mono font-bold text-[#64ffda] mb-6">📜 HISTORICAL DATA</h2>

      <div className="mb-8">
        <label className="block text-[#8892b0] font-mono text-sm mb-3">Select Month</label>
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-[#64ffda]" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 bg-[#112240] border border-[#233554] rounded-lg text-[#64ffda] font-mono focus:outline-none focus:border-[#64ffda] cursor-pointer"
          >
            {historicalData.map((month) => (
              <option key={month.monthKey} value={month.monthKey}>
                {month.month}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#233554]">
              <th className="text-left px-4 py-3 text-[#8892b0] font-mono font-bold">Month</th>
              <th className="text-right px-4 py-3 text-[#8892b0] font-mono font-bold">Resources Deleted</th>
              <th className="text-right px-4 py-3 text-[#8892b0] font-mono font-bold">Monthly Savings</th>
            </tr>
          </thead>
          <tbody>
            {historicalData.slice(0, 6).map((month, idx) => (
              <tr
                key={idx}
                onClick={() => setSelectedMonth(month.monthKey)}
                className={`border-b border-[#233554] cursor-pointer hover:bg-[#112240] transition-colors ${
                  month.monthKey === selectedMonth ? "bg-[#233554]" : ""
                }`}
              >
                <td className="px-4 py-3 text-[#ffffff] font-mono">{month.month}</td>
                <td className="text-right px-4 py-3 text-[#64ffda] font-mono font-bold">{month.resourcesDeleted}</td>
                <td className="text-right px-4 py-3 text-[#00ff88] font-mono font-bold">
                  ${month.monthlySavings.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="px-6 py-2 bg-[#233554] hover:bg-[#64ffda] hover:text-[#0a192f] rounded-lg font-mono font-bold text-sm transition-all">
        📊 View Full Report
      </button>
    </div>
  )
}

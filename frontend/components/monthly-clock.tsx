"use client"

import { useEffect, useState } from "react"

export default function MonthlyClock() {
  const [countdown, setCountdown] = useState({
    daysRemaining: 0,
    hoursRemaining: 0,
    percentComplete: 0,
  })

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date()
      const currentYear = now.getFullYear()
      const currentMonth = now.getMonth()

      // Get the last day of current month
      const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate()
      const endOfMonth = new Date(currentYear, currentMonth, lastDay, 23, 59, 59)

      const timeDiff = endOfMonth.getTime() - now.getTime()
      const daysRemaining = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
      const hoursRemaining = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

      const daysPassed = lastDay - daysRemaining - 1
      const percentComplete = (daysPassed / lastDay) * 100

      setCountdown({
        daysRemaining,
        hoursRemaining,
        percentComplete: Math.min(percentComplete, 100),
      })
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const monthName = new Date().toLocaleString("default", { month: "long", year: "numeric" })

  return (
    <div className="terminal-card">
      <h3 className="text-lg font-mono font-bold text-[#64ffda] mb-6">⏰ MONTHLY RESET</h3>

      <div className="space-y-4">
        <div>
          <p className="text-[#8892b0] font-mono text-sm mb-2">Next Reset</p>
          <p className="text-[#64ffda] font-mono font-bold">{`${monthName} ${new Date().getDate() + 1}`}</p>
        </div>

        <div>
          <p className="text-[#8892b0] font-mono text-sm mb-2">Time Remaining</p>
          <p className="text-[#00ff88] font-mono font-bold">
            {countdown.daysRemaining} days, {countdown.hoursRemaining} hours
          </p>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[#8892b0] font-mono text-sm">Progress</span>
            <span className="text-[#64ffda] font-mono font-bold">{countdown.percentComplete.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-[#112240] rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#00d9ff] to-[#64ffda] h-full transition-all duration-300"
              style={{ width: `${countdown.percentComplete}%` }}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[#233554]">
          <p className="text-[#8892b0] font-mono text-sm mb-1">Current Cycle</p>
          <p className="text-[#ffffff] font-mono font-bold">{monthName}</p>
        </div>
      </div>
    </div>
  )
}

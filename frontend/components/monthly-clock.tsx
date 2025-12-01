"use client";

import { useEffect, useState } from "react";

export default function MonthlyClock() {
  const [countdown, setCountdown] = useState({
    daysRemaining: 0,
    hoursRemaining: 0,
    percentComplete: 0,
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // Get the last day of current month
      const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
      const endOfMonth = new Date(
        currentYear,
        currentMonth,
        lastDay,
        23,
        59,
        59
      );

      const timeDiff = endOfMonth.getTime() - now.getTime();
      const daysRemaining = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hoursRemaining = Math.floor(
        (timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );

      const daysPassed = now.getDate();
      const percentComplete = (daysPassed / lastDay) * 100;

      setCountdown({
        daysRemaining,
        hoursRemaining,
        percentComplete: Math.min(percentComplete, 100),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const monthName = new Date().toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const nextResetDay =
    new Date().getDate() ===
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
      ? 1
      : new Date().getDate() + 1;

  return (
    <div className="terminal-card">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">⏰</span>
        <h3 className="text-lg font-mono font-bold text-[#64ffda]">
          MONTHLY RESET
        </h3>
      </div>

      <div className="space-y-5">
        {/* Next Reset Date */}
        <div className="bg-[#0a192f] rounded-lg p-4 border border-[#233554]">
          <p className="text-[#8892b0] font-mono text-xs mb-2">Next Reset</p>
          <p className="text-[#64ffda] font-mono font-bold text-lg">
            {monthName.split(" ")[0]} {nextResetDay}, {monthName.split(" ")[1]}
          </p>
        </div>

        {/* Time Remaining */}
        <div className="bg-[#0a192f] rounded-lg p-4 border border-[#233554]">
          <p className="text-[#8892b0] font-mono text-xs mb-2">
            Time Remaining
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-[#00ff88] font-mono font-bold text-2xl">
              {countdown.daysRemaining}
            </span>
            <span className="text-[#8892b0] font-mono text-sm">days</span>
            <span className="text-[#00ff88] font-mono font-bold text-xl">
              {countdown.hoursRemaining}
            </span>
            <span className="text-[#8892b0] font-mono text-sm">hours</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[#8892b0] font-mono text-xs">Progress</span>
            <span className="text-[#64ffda] font-mono font-bold text-sm">
              {countdown.percentComplete.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-[#0a192f] rounded-full h-3 overflow-hidden border border-[#233554]">
            <div
              className="bg-gradient-to-r from-[#00d9ff] via-[#64ffda] to-[#00ff88] h-full transition-all duration-500 shadow-lg shadow-[#64ffda]/50"
              style={{ width: `${countdown.percentComplete}%` }}
            />
          </div>
        </div>

        {/* Current Cycle */}
        <div className="pt-4 border-t border-[#233554]">
          <p className="text-[#8892b0] font-mono text-xs mb-2">Current Cycle</p>
          <p className="text-[#ffffff] font-mono font-bold text-base">
            {monthName}
          </p>
        </div>
      </div>
    </div>
  );
}

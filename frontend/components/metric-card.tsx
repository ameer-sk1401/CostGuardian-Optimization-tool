"use client"

export default function MetricCard({ title, value, icon, color }) {
  const colorClasses = {
    cyan: "border border-[#64ffda] border-opacity-30 hover:border-opacity-100 hover:shadow-[0_0_20px_rgba(100,255,218,0.3)] ",
    green:
      "border border-[#00ff88] border-opacity-30 hover:border-opacity-100 hover:shadow-[0_0_20px_rgba(0,255,136,0.3)] ",
    yellow:
      "border border-[#ffd700] border-opacity-30 hover:border-opacity-100 hover:shadow-[0_0_20px_rgba(255,215,0,0.3)] ",
    red: "border border-[#ff5555] border-opacity-30 hover:border-opacity-100 hover:shadow-[0_0_20px_rgba(255,85,85,0.3)] ",
  }

  return (
    <div className={`terminal-card ${colorClasses[color]} transition-all duration-300 counter-animate`}>
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-[#8892b0] text-sm font-mono">{title}</h3>
        <div className="w-8 h-8">{icon}</div>
      </div>
      <div className="text-3xl md:text-4xl font-mono font-bold text-[#ffffff]">{value}</div>
    </div>
  )
}

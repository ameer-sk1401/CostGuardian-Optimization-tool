"use client"

export default function Footer({ data }) {
  const lastUpdated = data?.metadata?.last_updated
    ? new Date(data.metadata.last_updated).toLocaleString()
    : new Date().toLocaleString()

  const nextRefresh = new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString()

  return (
    <footer className="border-t border-[#233554] mt-16 py-8 bg-[#0a192f]/50">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[#8892b0] font-mono text-sm">
          <div>
            Last Updated: <span className="text-[#64ffda]">{lastUpdated}</span>
          </div>
          <div>
            Data refreshes every 5 minutes • Next update in <span className="text-[#64ffda]">{nextRefresh}</span>
          </div>
          <div>
            GitHub: <span className="text-[#64ffda]">@username</span> • CostGuardian v1.0
          </div>
        </div>
      </div>
    </footer>
  )
}

"use client"

import { useState, useMemo } from "react"
import { ChevronDown, Copy, Download } from "lucide-react"

export default function ResourceTable({ data }) {
  const [sortConfig, setSortConfig] = useState({ key: "monthly_savings", direction: "desc" })
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  const allResources = useMemo(() => {
    return [...(data?.deleted_resources || []), ...(data?.current_resources || [])]
  }, [data])

  const filteredAndSorted = useMemo(() => {
    let items = allResources

    // Filter by status
    if (filterStatus !== "all") {
      items = items.filter((item) => {
        const status = item.status?.toLowerCase() || "unknown"
        return status.includes(filterStatus.toLowerCase())
      })
    }

    // Search
    if (searchQuery) {
      items = items.filter(
        (item) =>
          item.resource_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.resource_type?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Sort
    items.sort((a, b) => {
      let aValue = a[sortConfig.key] || 0
      let bValue = b[sortConfig.key] || 0

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase()
        bValue = (bValue as string).toLowerCase()
      }

      return sortConfig.direction === "asc" ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1
    })

    return items
  }, [allResources, filterStatus, searchQuery, sortConfig])

  const paginatedItems = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage
    return filteredAndSorted.slice(startIdx, startIdx + itemsPerPage)
  }, [filteredAndSorted, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage)

  const handleSort = (key: string) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === "desc" ? "asc" : "desc",
    })
  }

  const exportToCSV = () => {
    const headers = ["Resource ID", "Type", "Status", "Cost/Savings", "Last Checked"]
    const rows = filteredAndSorted.map((item) => [
      item.resource_id,
      item.resource_type,
      item.status,
      item.monthly_cost || item.monthly_savings || "N/A",
      item.last_checked || item.deleted_at || "N/A",
    ])

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `costguardian-resources-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  const getStatusColor = (status: string) => {
    if (status?.toLowerCase().includes("active")) return "text-[#00ff88]"
    if (status?.toLowerCase().includes("deleted")) return "text-[#ff5555]"
    if (status?.toLowerCase().includes("idle")) return "text-[#ffd700]"
    return "text-[#8892b0]"
  }

  return (
    <div className="terminal-card mt-12 overflow-hidden">
      <div className="flex flex-col gap-4 mb-6">
        <h2 className="text-xl font-mono font-bold text-[#64ffda]">📊 DETECTED & DELETED RESOURCES</h2>

        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {["all", "active", "deleted", "idle"].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilterStatus(status)
                  setCurrentPage(1)
                }}
                className={`px-3 py-1 rounded font-mono text-sm transition-all ${
                  filterStatus === status
                    ? "bg-[#64ffda] text-[#0a192f]"
                    : "bg-[#233554] text-[#8892b0] hover:text-[#64ffda]"
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="🔍 Search resources..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="flex-1 md:flex-none px-3 py-2 bg-[#112240] border border-[#233554] rounded text-[#ffffff] font-mono text-sm placeholder-[#8892b0] focus:outline-none focus:border-[#64ffda] focus:shadow-[0_0_10px_rgba(100,255,218,0.2)]"
            />
            <button
              onClick={exportToCSV}
              className="px-3 py-2 bg-[#233554] hover:bg-[#64ffda] hover:text-[#0a192f] rounded font-mono text-sm transition-all flex items-center gap-2"
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#233554]">
              {["Resource ID", "Type", "Status", "Cost", "Last Checked"].map((header, idx) => (
                <th
                  key={idx}
                  onClick={() => {
                    const keys = ["resource_id", "resource_type", "status", "monthly_cost", "last_checked"]
                    handleSort(keys[idx])
                  }}
                  className="text-left px-4 py-3 text-[#8892b0] font-mono font-bold cursor-pointer hover:text-[#64ffda] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {header}
                    {sortConfig.key ===
                      ["resource_id", "resource_type", "status", "monthly_cost", "last_checked"][idx] && (
                      <ChevronDown size={14} className={sortConfig.direction === "asc" ? "rotate-180" : ""} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((item, idx) => (
              <tr
                key={idx}
                className="border-b border-[#233554] hover:bg-[#112240] transition-colors cursor-pointer group"
              >
                <td className="px-4 py-3 text-[#ffffff] font-mono text-xs truncate max-w-[200px]">
                  <div className="flex items-center gap-2">
                    {item.resource_id}
                    <button
                      onClick={() => navigator.clipboard.writeText(item.resource_id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy size={12} className="text-[#64ffda]" />
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#8892b0] font-mono text-xs">{item.resource_type}</td>
                <td className={`px-4 py-3 font-mono text-xs font-bold ${getStatusColor(item.status)}`}>
                  {item.status}
                </td>
                <td className="px-4 py-3 text-[#ffffff] font-mono text-xs">
                  ${(item.monthly_cost || item.monthly_savings || 0).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-[#8892b0] font-mono text-xs">
                  {new Date(item.last_checked || item.deleted_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-[#233554]">
        <div className="text-[#8892b0] font-mono text-sm">
          Showing {paginatedItems.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} of {filteredAndSorted.length}{" "}
          resources
        </div>

        <div className="flex items-center gap-4">
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value))
              setCurrentPage(1)
            }}
            className="px-3 py-2 bg-[#112240] border border-[#233554] rounded text-[#8892b0] font-mono text-sm focus:outline-none focus:border-[#64ffda]"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>

          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 bg-[#233554] disabled:opacity-50 rounded font-mono text-sm hover:bg-[#64ffda] hover:text-[#0a192f] transition-all"
            >
              ← Prev
            </button>
            <div className="px-3 py-2 text-[#8892b0] font-mono text-sm">
              {currentPage} / {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 bg-[#233554] disabled:opacity-50 rounded font-mono text-sm hover:bg-[#64ffda] hover:text-[#0a192f] transition-all"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

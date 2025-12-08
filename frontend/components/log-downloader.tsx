"use client";

import { useState } from "react";
import { Download, Calendar, FileJson, Filter } from "lucide-react";

interface LogDownloaderProps {
  data: any;
}

export default function LogDownloader({ data }: LogDownloaderProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Get available months/years from deleted resources
  const getAvailableMonths = () => {
    if (!data?.deleted_resources || data.deleted_resources.length === 0) {
      return [];
    }

    const monthsSet = new Set<string>();
    data.deleted_resources.forEach((resource: any) => {
      const date = new Date(resource.deleted_at);
      const monthYear = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      monthsSet.add(monthYear);
    });

    return Array.from(monthsSet).sort().reverse();
  };

  const availableMonths = getAvailableMonths();

  // Download all logs (from beginning to current date)
  const downloadAllLogs = () => {
    if (!data?.deleted_resources || data.deleted_resources.length === 0) {
      alert("No deleted resources data available to download.");
      return;
    }

    const currentDate = new Date();
    const filteredResources = data.deleted_resources.filter((resource: any) => {
      const deletedDate = new Date(resource.deleted_at);
      return deletedDate <= currentDate;
    });

    const exportData = {
      export_info: {
        title: "CostGuardian - Complete Deletion Log",
        export_date: currentDate.toISOString(),
        date_range: {
          from:
            filteredResources.length > 0
              ? new Date(
                  filteredResources[filteredResources.length - 1].deleted_at
                ).toISOString()
              : currentDate.toISOString(),
          to: currentDate.toISOString(),
        },
        total_resources: filteredResources.length,
        total_monthly_savings: filteredResources
          .reduce((sum: number, r: any) => sum + (r.monthly_savings || 0), 0)
          .toFixed(2),
        total_annual_savings: filteredResources
          .reduce(
            (sum: number, r: any) =>
              sum + (r.annual_savings || r.monthly_savings * 12 || 0),
            0
          )
          .toFixed(2),
      },
      deleted_resources: filteredResources.map((resource: any) => ({
        resource_type: resource.resource_type,
        resource_id: resource.resource_id,
        resource_name: resource.resource_name || "Unnamed",
        deleted_at: resource.deleted_at,
        deleted_date_readable: new Date(resource.deleted_at).toLocaleString(),
        monthly_savings: `$${(resource.monthly_savings || 0).toFixed(2)}`,
        annual_savings: `$${(
          resource.annual_savings ||
          resource.monthly_savings * 12 ||
          0
        ).toFixed(2)}`,
        region: resource.region || data?.config?.aws_region || "us-east-1",
      })),
      summary: {
        breakdown_by_type: getBreakdownByType(filteredResources),
        breakdown_by_month: getBreakdownByMonth(filteredResources),
      },
    };

    downloadJSON(
      exportData,
      `costguardian-complete-log-${formatDate(currentDate)}.json`
    );
  };

  // Download logs for specific month
  const downloadMonthLog = (monthYear: string) => {
    if (!data?.deleted_resources || data.deleted_resources.length === 0) {
      alert("No deleted resources data available to download.");
      return;
    }

    const [year, month] = monthYear.split("-");
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const filteredResources = data.deleted_resources.filter((resource: any) => {
      const deletedDate = new Date(resource.deleted_at);
      return deletedDate >= startDate && deletedDate <= endDate;
    });

    if (filteredResources.length === 0) {
      alert(
        `No resources deleted in ${getMonthName(parseInt(month) - 1)} ${year}.`
      );
      return;
    }

    const exportData = {
      export_info: {
        title: `CostGuardian - ${getMonthName(
          parseInt(month) - 1
        )} ${year} Deletion Log`,
        export_date: new Date().toISOString(),
        month: getMonthName(parseInt(month) - 1),
        year: year,
        date_range: {
          from: startDate.toISOString(),
          to: endDate.toISOString(),
        },
        total_resources: filteredResources.length,
        total_monthly_savings: filteredResources
          .reduce((sum: number, r: any) => sum + (r.monthly_savings || 0), 0)
          .toFixed(2),
        total_annual_savings: filteredResources
          .reduce(
            (sum: number, r: any) =>
              sum + (r.annual_savings || r.monthly_savings * 12 || 0),
            0
          )
          .toFixed(2),
      },
      deleted_resources: filteredResources.map((resource: any) => ({
        resource_type: resource.resource_type,
        resource_id: resource.resource_id,
        resource_name: resource.resource_name || "Unnamed",
        deleted_at: resource.deleted_at,
        deleted_date_readable: new Date(resource.deleted_at).toLocaleString(),
        monthly_savings: `$${(resource.monthly_savings || 0).toFixed(2)}`,
        annual_savings: `$${(
          resource.annual_savings ||
          resource.monthly_savings * 12 ||
          0
        ).toFixed(2)}`,
        region: resource.region || data?.config?.aws_region || "us-east-1",
      })),
      summary: {
        breakdown_by_type: getBreakdownByType(filteredResources),
        breakdown_by_day: getBreakdownByDay(filteredResources),
      },
    };

    downloadJSON(exportData, `costguardian-${year}-${month}-log.json`);
  };

  // Helper: Get breakdown by resource type
  const getBreakdownByType = (resources: any[]) => {
    const breakdown: { [key: string]: { count: number; savings: number } } = {};

    resources.forEach((resource: any) => {
      const type = resource.resource_type;
      if (!breakdown[type]) {
        breakdown[type] = { count: 0, savings: 0 };
      }
      breakdown[type].count++;
      breakdown[type].savings += resource.monthly_savings || 0;
    });

    return Object.entries(breakdown).map(([type, info]) => ({
      type,
      count: info.count,
      monthly_savings: `$${info.savings.toFixed(2)}`,
      annual_savings: `$${(info.savings * 12).toFixed(2)}`,
    }));
  };

  // Helper: Get breakdown by month
  const getBreakdownByMonth = (resources: any[]) => {
    const breakdown: { [key: string]: { count: number; savings: number } } = {};

    resources.forEach((resource: any) => {
      const date = new Date(resource.deleted_at);
      const monthYear = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!breakdown[monthYear]) {
        breakdown[monthYear] = { count: 0, savings: 0 };
      }
      breakdown[monthYear].count++;
      breakdown[monthYear].savings += resource.monthly_savings || 0;
    });

    return Object.entries(breakdown)
      .sort()
      .map(([monthYear, info]) => {
        const [year, month] = monthYear.split("-");
        return {
          month: getMonthName(parseInt(month) - 1),
          year,
          count: info.count,
          monthly_savings: `$${info.savings.toFixed(2)}`,
          annual_savings: `$${(info.savings * 12).toFixed(2)}`,
        };
      });
  };

  // Helper: Get breakdown by day (for monthly reports)
  const getBreakdownByDay = (resources: any[]) => {
    const breakdown: { [key: string]: { count: number; savings: number } } = {};

    resources.forEach((resource: any) => {
      const date = new Date(resource.deleted_at);
      const day = date.toISOString().split("T")[0]; // YYYY-MM-DD

      if (!breakdown[day]) {
        breakdown[day] = { count: 0, savings: 0 };
      }
      breakdown[day].count++;
      breakdown[day].savings += resource.monthly_savings || 0;
    });

    return Object.entries(breakdown)
      .sort()
      .map(([day, info]) => ({
        date: day,
        date_readable: new Date(day).toLocaleDateString(),
        count: info.count,
        monthly_savings: `$${info.savings.toFixed(2)}`,
      }));
  };

  // Helper: Download JSON file
  const downloadJSON = (data: any, filename: string) => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Show success message
    const message = document.createElement("div");
    message.className =
      "fixed bottom-4 right-4 bg-terminal-green text-terminal-dark px-6 py-3 rounded-lg font-mono font-bold shadow-lg z-50";
    message.textContent = `✓ Downloaded: ${filename}`;
    document.body.appendChild(message);
    setTimeout(() => document.body.removeChild(message), 3000);
  };

  // Helper: Format date for filename
  const formatDate = (date: Date) => {
    return date.toISOString().split("T")[0];
  };

  // Helper: Get month name
  const getMonthName = (monthIndex: number) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months[monthIndex];
  };

  const totalResources = data?.deleted_resources?.length || 0;

  return (
    <div className="terminal-window mb-6">
      <div className="terminal-header">
        <div className="terminal-button terminal-button-red"></div>
        <div className="terminal-button terminal-button-amber"></div>
        <div className="terminal-button terminal-button-green"></div>
        <span className="ml-3 text-terminal-muted text-sm">
          $ logs.download --format=json
        </span>
      </div>

      <div className="terminal-content">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2 text-terminal-cyan mb-4">
            <FileJson size={20} />
            <h3 className="text-lg font-bold">Download Deletion Logs</h3>
          </div>

          {/* Info */}
          <div className="bg-terminal-dark border border-terminal-green/30 rounded p-3 mb-4">
            <div className="text-terminal-muted text-sm space-y-1">
              <div>
                <span className="text-terminal-green">$</span> Total resources
                deleted:{" "}
                <span className="text-terminal-cyan">{totalResources}</span>
              </div>
              <div>
                <span className="text-terminal-green">$</span> Available months:{" "}
                <span className="text-terminal-cyan">
                  {availableMonths.length}
                </span>
              </div>
            </div>
          </div>

          {/* Download All Button */}
          <div>
            <button
              onClick={downloadAllLogs}
              disabled={totalResources === 0}
              className="w-full terminal-btn flex items-center justify-center gap-2 text-base"
            >
              <Download size={18} />
              <span>Download Complete Log (All Time)</span>
            </button>
            <p className="text-terminal-muted text-xs mt-2 text-center">
              Downloads all deleted resources from the beginning to current date
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2 my-4">
            <div className="flex-1 border-t border-terminal-green/30"></div>
            <span className="text-terminal-muted text-xs">OR</span>
            <div className="flex-1 border-t border-terminal-green/30"></div>
          </div>

          {/* Month Selection */}
          <div>
            <div className="flex items-center gap-2 text-terminal-cyan mb-3">
              <Calendar size={16} />
              <h4 className="text-sm font-bold">Download by Month</h4>
            </div>

            {availableMonths.length > 0 ? (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableMonths.map((monthYear) => {
                    const [year, month] = monthYear.split("-");
                    const monthName = getMonthName(parseInt(month) - 1);

                    // Count resources for this month
                    const monthResources = data.deleted_resources.filter(
                      (r: any) => {
                        const d = new Date(r.deleted_at);
                        return (
                          d.getFullYear() === parseInt(year) &&
                          d.getMonth() === parseInt(month) - 1
                        );
                      }
                    );

                    const monthSavings = monthResources.reduce(
                      (sum: number, r: any) => sum + (r.monthly_savings || 0),
                      0
                    );

                    return (
                      <button
                        key={monthYear}
                        onClick={() => downloadMonthLog(monthYear)}
                        className="bg-terminal-light border border-terminal-green/30 hover:border-terminal-cyan/50 rounded p-3 transition-all text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-terminal-cyan font-bold text-sm">
                              {monthName} {year}
                            </div>
                            <div className="text-terminal-muted text-xs mt-1">
                              {monthResources.length} resources • $
                              {monthSavings.toFixed(2)} saved
                            </div>
                          </div>
                          <Download size={16} className="text-terminal-green" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-terminal-muted text-sm text-center py-4 border border-terminal-green/30 rounded">
                <span className="text-terminal-green">$</span> No monthly data
                available yet
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="mt-4 pt-4 border-t border-terminal-green/30">
            <div className="text-terminal-muted text-xs space-y-1">
              <div>
                <span className="text-terminal-green">$</span> File format: JSON
              </div>
              <div>
                <span className="text-terminal-green">$</span> Includes:
                Resource details, timestamps, savings, breakdowns
              </div>
              <div>
                <span className="text-terminal-green">$</span> Compatible with:
                Excel, Google Sheets, data analysis tools
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

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
} from "recharts";

export default function Charts({ data }) {
  const weeklySavings = data?.weekly_savings || [
    { week: "Week 1", savings: 15.2 },
    { week: "Week 2", savings: 22.5 },
    { week: "Week 3", savings: 31.0 },
    { week: "Week 4", savings: 39.0 },
  ];

  const breakdownData = data?.breakdown
    ? Object.entries(data.breakdown).map(([type, info]: any) => ({
        name: type,
        value: info.monthly_savings || 0,
      }))
    : [];

  const deletionTimeline = data?.activity || [
    { date: "Nov 21", deleted: 0 },
    { date: "Nov 22", deleted: 1 },
    { date: "Nov 23", deleted: 0 },
    { date: "Nov 24", deleted: 1 },
    { date: "Nov 25", deleted: 1 },
  ];

  const COLORS = ["#64ffda", "#00d9ff", "#00ff88", "#ffd700", "#ff5555"];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      return (
        <div className="bg-[#1d2d50] border border-[#64ffda] rounded p-3 font-mono text-sm shadow-lg">
          <p className="text-[#64ffda] mb-1">{label || payload[0]?.name}</p>
          <p className="text-[#00ff88] font-bold">
            ${payload[0]?.value?.toFixed(2)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Weekly Savings Chart - Taller and more prominent */}
      <div className="terminal-card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">📈</span>
          <h3 className="text-lg font-mono font-bold text-[#64ffda]">
            WEEKLY SAVINGS TREND
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart
            data={weeklySavings}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#233554" />
            <XAxis
              dataKey="week"
              stroke="#8892b0"
              style={{ fontSize: "11px", fontFamily: "monospace" }}
              tickMargin={8}
            />
            <YAxis
              stroke="#8892b0"
              style={{ fontSize: "11px", fontFamily: "monospace" }}
              tickMargin={8}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="savings"
              stroke="#64ffda"
              strokeWidth={3}
              dot={{ fill: "#64ffda", r: 5 }}
              activeDot={{ r: 7, stroke: "#00ff88", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Two Charts - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Savings Breakdown - Pie Chart */}
        <div className="terminal-card">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🥧</span>
            <h3 className="text-base font-mono font-bold text-[#64ffda]">
              SAVINGS BY RESOURCE
            </h3>
          </div>
          {breakdownData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={breakdownData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: $${value.toFixed(1)}`}
                  outerRadius={70}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {breakdownData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-[#8892b0] font-mono text-sm mb-2">
                  No data available
                </p>
                <p className="text-[#64ffda] font-mono text-xs">
                  Waiting for resources to be analyzed
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Deletion Timeline - Bar Chart */}
        <div className="terminal-card">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">📊</span>
            <h3 className="text-base font-mono font-bold text-[#64ffda]">
              RESOURCES DELETED (30d)
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={deletionTimeline}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#233554" />
              <XAxis
                dataKey="date"
                stroke="#8892b0"
                style={{ fontSize: "10px", fontFamily: "monospace" }}
                tickMargin={8}
              />
              <YAxis
                stroke="#8892b0"
                style={{ fontSize: "10px", fontFamily: "monospace" }}
                tickMargin={8}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="deleted" fill="#64ffda" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

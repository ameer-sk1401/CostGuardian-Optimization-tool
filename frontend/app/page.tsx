"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header";
import UserMenu from "@/components/user-menu";
import MetricsOverview from "@/components/metrics-overview";
import ResourceTable from "@/components/resource-table";
import Charts from "@/components/charts";
import MonthlyClock from "@/components/monthly-clock";
import HistorySection from "@/components/history-section";
import Footer from "@/components/footer";

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load config
        const configResponse = await fetch("/config.json");
        const config = await configResponse.json();

        // Load data from GitHub
        const dataUrl = `https://raw.githubusercontent.com/${config.user_info.github_repo}/main/public/data.json`;
        const response = await fetch(dataUrl);
        const jsonData = await response.json();

        // Combine config and data
        const fullData = {
          ...jsonData,
          config: config.user_info,
        };

        setData(fullData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to fetch data");
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a192f] via-[#112240] to-[#0a192f] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#64ffda] text-4xl font-mono mb-4">
            loading...
          </div>
          <div className="inline-block animate-spin">
            <div className="w-8 h-8 border-2 border-[#64ffda] border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  const mockData = data || {
    metadata: {
      last_updated: new Date().toISOString(),
      version: "1.0",
    },
    overview: {
      total_resources: 25,
      resources_deleted: 3,
      idle_resources: 2,
      active_resources: 20,
      monthly_savings: 39.0,
      annual_savings: 468.0,
    },
    breakdown: {
      "NAT Gateway": {
        count: 1,
        deleted: 1,
        monthly_savings: 32.4,
      },
      "Elastic IP": {
        count: 1,
        deleted: 1,
        monthly_savings: 3.6,
      },
      "EBS Volume": {
        count: 1,
        deleted: 1,
        monthly_savings: 3.0,
      },
    },
    activity: [
      { date: "2025-11-21", deleted: 0, warned: 1, active: 20 },
      { date: "2025-11-22", deleted: 1, warned: 0, active: 20 },
      { date: "2025-11-23", deleted: 0, warned: 1, active: 20 },
      { date: "2025-11-24", deleted: 1, warned: 0, active: 20 },
      { date: "2025-11-25", deleted: 1, warned: 0, active: 20 },
    ],
    weekly_savings: [
      { week: "Week 1", savings: 15.2 },
      { week: "Week 2", savings: 22.5 },
      { week: "Week 3", savings: 31.0 },
      { week: "Week 4", savings: 39.0 },
    ],
    current_resources: [
      {
        resource_id: "i-0abc123def456",
        resource_type: "EC2 Instance",
        status: "Active",
        monthly_cost: 8.4,
        last_checked: "2025-11-25T08:00:00Z",
      },
      {
        resource_id: "vol-0xyz789def012",
        resource_type: "EBS Volume",
        status: "Active",
        monthly_cost: 5.2,
        last_checked: "2025-11-25T08:00:00Z",
      },
    ],
    deleted_resources: [
      {
        resource_id: "nat-0abc123def456",
        resource_type: "NAT Gateway",
        status: "Deleted",
        monthly_savings: 32.4,
        deleted_at: "2025-11-24T10:30:00Z",
        backup_location: "s3://backups/nat-123",
      },
      {
        resource_id: "eipalloc-xyz789def012",
        resource_type: "Elastic IP",
        status: "Released",
        monthly_savings: 3.6,
        deleted_at: "2025-11-23T15:45:00Z",
        backup_location: "s3://backups/eip-456",
      },
      {
        resource_id: "vol-123abc456def789",
        resource_type: "EBS Volume",
        status: "Deleted",
        monthly_savings: 3.0,
        deleted_at: "2025-11-22T09:15:00Z",
        backup_location: "s3://backups/vol-789",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a192f] via-[#112240] to-[#0a192f] relative">
      <Header userMenuOpen={userMenuOpen} setUserMenuOpen={setUserMenuOpen} />
      {userMenuOpen && (
        <UserMenu onClose={() => setUserMenuOpen(false)} data={mockData} />
      )}

      <main className="container mx-auto px-4 py-8 lg:py-12 max-w-7xl">
        {error && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <MetricsOverview data={mockData} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 my-12">
          <div className="lg:col-span-2">
            <Charts data={mockData} />
          </div>
          <div>
            <MonthlyClock />
          </div>
        </div>

        <ResourceTable data={mockData} />
        <HistorySection />
      </main>

      <Footer data={mockData} />
    </div>
  );
}

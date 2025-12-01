"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header";
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

  useEffect(() => {
    async function fetchData() {
      try {
        console.log("🔍 Starting data fetch...");

        // Step 1: Load config.json (local file)
        console.log("📥 Loading config.json...");
        const configResponse = await fetch("/config.json");

        if (!configResponse.ok) {
          throw new Error(
            `Failed to load config.json: ${configResponse.status}`
          );
        }

        const config = await configResponse.json();
        console.log("✅ Config loaded:", config);

        // Step 2: Load data.json from GitHub
        const dataUrl = `https://raw.githubusercontent.com/${config.user_info.github_repo}/main/frontend/public/data.json`;
        console.log("📥 Loading data from:", dataUrl);

        const dataResponse = await fetch(dataUrl, {
          cache: "no-store", // Always get fresh data
          headers: {
            Accept: "application/json",
          },
        });

        if (!dataResponse.ok) {
          throw new Error(`Failed to load data.json: ${dataResponse.status}`);
        }

        const jsonData = await dataResponse.json();
        console.log("✅ Data loaded:", jsonData);

        // Step 3: Combine config and data
        const fullData = {
          ...jsonData,
          config: config.user_info,
        };

        console.log("✅ Full data combined:", fullData);
        setData(fullData);
        setError(null);
      } catch (err) {
        console.error("❌ Error fetching data:", err);
        setError(err.message);

        // Use empty data instead of mock data
        setData({
          metadata: {
            last_updated: new Date().toISOString(),
            version: "1.0.0",
          },
          overview: {
            total_resources: 0,
            resources_deleted: 0,
            monthly_savings: 0,
            annual_savings: 0,
            active_resources: 0,
            idle_resources: 0,
          },
          breakdown: {},
          activity: [],
          current_resources: [],
          deleted_resources: [],
          config: {
            github_username: "your-username",
            github_repo: "username/repo",
            aws_account_id: "941431936794",
            aws_region: "us-east-1",
          },
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();

    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a192f] to-[#112240] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#64ffda] mb-4"></div>
          <p className="text-[#64ffda] font-mono">Loading CostGuardian...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a192f] to-[#112240] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#112240] border border-red-500 rounded-lg p-6">
          <h2 className="text-red-500 font-mono font-bold text-xl mb-2">
            ⚠️ Error Loading Data
          </h2>
          <p className="text-[#8892b0] font-mono mb-4">{error}</p>
          <div className="space-y-2 text-sm text-[#8892b0]">
            <p className="font-mono">Possible issues:</p>
            <ul className="list-disc list-inside space-y-1 pl-4">
              <li>config.json is missing from frontend/public/</li>
              <li>data.json is not available on GitHub</li>
              <li>GitHub repository URL is incorrect</li>
              <li>Network connection issue</li>
            </ul>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 w-full bg-[#64ffda] text-[#0a192f] font-mono font-bold py-2 px-4 rounded hover:bg-[#00ff88] transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a192f] to-[#112240]">
      <Header data={data} />
      <main className="container mx-auto px-4 py-8">
        <MetricsOverview data={data} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2">
            <ResourceTable data={data} />
          </div>
          <div className="space-y-6">
            <MonthlyClock data={data} />
            <Charts data={data} />
          </div>
        </div>
        <HistorySection data={data} />
      </main>
      <Footer />
    </div>
  );
}

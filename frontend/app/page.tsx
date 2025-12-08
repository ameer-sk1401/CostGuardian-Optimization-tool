"use client";

import { useState, useEffect } from "react";
import { DollarSign, Server, TrendingDown, Activity } from "lucide-react";
import LogDownloader from "@/components/log-downloader";

// Define types
interface Overview {
  total_resources: number;
  resources_deleted: number;
  monthly_savings: number;
  annual_savings: number;
  active_resources: number;
  idle_resources: number;
}

interface Breakdown {
  [key: string]: {
    count: number;
    monthly_savings?: number;
  };
}

interface DeletedResource {
  resource_type: string;
  resource_id: string;
  deleted_at: string;
  monthly_savings: number;
}

interface DashboardData {
  overview: Overview;
  breakdown: Breakdown;
  deleted_resources: DeletedResource[];
  config: {
    aws_account_id: string;
    aws_region: string;
  };
}

export default function TerminalDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const configResponse = await fetch("/config.json");
        const config = await configResponse.json();

        const dataUrl = `https://raw.githubusercontent.com/${config.user_info.github_repo}/main/frontend/public/data.json`;
        const dataResponse = await fetch(dataUrl, {
          cache: "no-store",
          headers: { Accept: "application/json" },
        });

        const jsonData = await jsonResponse.json();
        setData({ ...jsonData, config: config.user_info });
      } catch (err) {
        console.error("Error fetching data:", err);
        setData({
          overview: {
            total_resources: 0,
            resources_deleted: 0,
            monthly_savings: 0,
            annual_savings: 0,
            active_resources: 0,
            idle_resources: 0,
          },
          breakdown: {},
          deleted_resources: [],
          config: {
            aws_account_id: "941431936794",
            aws_region: "us-east-1",
          },
        });
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-terminal-dark">
        <div className="terminal-window w-96 p-8">
          <div className="flex items-center gap-2 text-terminal-green">
            <span className="text-2xl">$</span>
            <span className="text-xl">Initializing CostGuardian</span>
            <span className="loading-dots"></span>
          </div>
        </div>
      </div>
    );
  }

  const overview = data?.overview || {
    total_resources: 0,
    resources_deleted: 0,
    monthly_savings: 0,
    annual_savings: 0,
    active_resources: 0,
    idle_resources: 0,
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-terminal-dark">
      {/* Header */}
      <header className="terminal-window mb-6">
        <div className="terminal-header">
          <div className="terminal-button terminal-button-red"></div>
          <div className="terminal-button terminal-button-amber"></div>
          <div className="terminal-button terminal-button-green"></div>
          <span className="ml-3 text-terminal-muted text-sm">
            costguardian@aws:~$
          </span>
        </div>
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <pre className="ascii-art text-terminal-green text-[8px] sm:text-[10px] md:text-xs">
                {`   ______          __  ______                     ___           
  / ____/___  _____/ /_/ ____/_  ______ __________/ (_)___ _____ 
 / /   / __ \\/ ___/ __/ / __/ / / / __ \`/ ___/ __  / / __ \`/ __ \\
/ /___/ /_/ (__  ) /_/ /_/ / /_/ / /_/ / /  / /_/ / / /_/ / / / /
\\____/\\____/____/\\__/\\____/\\__,_/\\__,_/_/   \\__,_/_/\\__,_/_/ /_/ `}
              </pre>
              <p className="text-terminal-cyan mt-2 text-sm">
                $ cloud.cost.optimizer --mode=aggressive
              </p>
            </div>
            <div className="text-right">
              <div className="text-terminal-muted text-sm">$ date</div>
              <div className="text-terminal-green font-bold text-lg">
                {currentTime.toLocaleString()}
              </div>
              <div className="text-terminal-cyan text-xs">
                AWS Region: {data?.config?.aws_region || "us-east-1"}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Monthly Savings */}
        <div className="stat-card">
          <div className="flex items-start justify-between mb-2">
            <DollarSign className="text-terminal-green" size={24} />
            <span className="text-terminal-muted text-xs">
              $ monthly_savings
            </span>
          </div>
          <div className="text-3xl font-bold text-terminal-green glow-green">
            ${overview.monthly_savings?.toFixed(2) || "0.00"}
          </div>
          <div className="text-terminal-muted text-sm mt-1">/month</div>
        </div>

        {/* Annual Savings */}
        <div className="stat-card">
          <div className="flex items-start justify-between mb-2">
            <TrendingDown className="text-terminal-cyan" size={24} />
            <span className="text-terminal-muted text-xs">
              $ annual_savings
            </span>
          </div>
          <div className="text-3xl font-bold text-terminal-cyan glow-cyan">
            ${overview.annual_savings?.toFixed(2) || "0.00"}
          </div>
          <div className="text-terminal-muted text-sm mt-1">/year</div>
        </div>

        {/* Resources Deleted */}
        <div className="stat-card">
          <div className="flex items-start justify-between mb-2">
            <Server className="text-terminal-amber" size={24} />
            <span className="text-terminal-muted text-xs">
              $ resources.deleted
            </span>
          </div>
          <div className="text-3xl font-bold text-terminal-amber">
            {overview.resources_deleted || 0}
          </div>
          <div className="text-terminal-muted text-sm mt-1">resources</div>
        </div>

        {/* Idle Resources */}
        <div className="stat-card">
          <div className="flex items-start justify-between mb-2">
            <Activity className="text-terminal-red" size={24} />
            <span className="text-terminal-muted text-xs">
              $ resources.idle
            </span>
          </div>
          <div className="text-3xl font-bold text-terminal-red">
            {overview.idle_resources || 0}
          </div>
          <div className="text-terminal-muted text-sm mt-1">
            pending deletion
          </div>
        </div>
      </div>

      {/* Log Downloader Section */}
      {data && <LogDownloader data={data} />}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Terminal Output - Deleted Resources */}
        <div className="lg:col-span-2">
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-button terminal-button-red"></div>
              <div className="terminal-button terminal-button-amber"></div>
              <div className="terminal-button terminal-button-green"></div>
              <span className="ml-3 text-terminal-muted text-sm">
                $ cat /var/log/costguardian/deleted_resources.log
              </span>
            </div>
            <div className="terminal-content max-h-[600px] overflow-y-auto">
              {data?.deleted_resources && data.deleted_resources.length > 0 ? (
                <div className="space-y-2">
                  {data.deleted_resources
                    .slice(0, 20)
                    .map((resource, index) => (
                      <div key={index} className="font-mono text-sm">
                        <span className="text-terminal-green">$</span>{" "}
                        <span className="text-terminal-cyan">
                          [{new Date(resource.deleted_at).toLocaleString()}]
                        </span>{" "}
                        <span className="text-terminal-amber">DELETED</span>{" "}
                        <span className="text-terminal-text">
                          {resource.resource_type}
                        </span>{" "}
                        <span className="text-terminal-muted">
                          {resource.resource_id}
                        </span>{" "}
                        <span className="text-terminal-green">
                          💰 ${resource.monthly_savings?.toFixed(2)}/mo
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-terminal-muted">
                  <span className="text-terminal-green">$</span> No resources
                  deleted yet
                  <span className="cursor-blink">_</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Resource Breakdown */}
        <div className="space-y-6">
          {/* Resource Breakdown */}
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-button terminal-button-red"></div>
              <div className="terminal-button terminal-button-amber"></div>
              <div className="terminal-button terminal-button-green"></div>
              <span className="ml-3 text-terminal-muted text-sm">
                $ cat resources.json
              </span>
            </div>
            <div className="terminal-content">
              <div className="space-y-3">
                {data?.breakdown && Object.keys(data.breakdown).length > 0 ? (
                  Object.entries(data.breakdown).map(([type, info]) => (
                    <div
                      key={type}
                      className="flex justify-between items-center"
                    >
                      <span className="text-terminal-cyan">
                        &quot;{type}&quot;:
                      </span>
                      <span className="text-terminal-green">{info.count}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-terminal-muted">&#123;&#125;</div>
                )}
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="terminal-window">
            <div className="terminal-header">
              <div className="terminal-button terminal-button-red"></div>
              <div className="terminal-button terminal-button-amber"></div>
              <div className="terminal-button terminal-button-green"></div>
              <span className="ml-3 text-terminal-muted text-sm">
                $ system.info
              </span>
            </div>
            <div className="terminal-content space-y-2 text-sm">
              <div>
                <span className="text-terminal-green">$</span>{" "}
                <span className="text-terminal-cyan">account_id:</span>{" "}
                <span className="text-terminal-text">
                  {data?.config?.aws_account_id || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-terminal-green">$</span>{" "}
                <span className="text-terminal-cyan">region:</span>{" "}
                <span className="text-terminal-text">
                  {data?.config?.aws_region || "us-east-1"}
                </span>
              </div>
              <div>
                <span className="text-terminal-green">$</span>{" "}
                <span className="text-terminal-cyan">status:</span>{" "}
                <span className="text-terminal-green">ACTIVE</span>
              </div>
              <div>
                <span className="text-terminal-green">$</span>{" "}
                <span className="text-terminal-cyan">mode:</span>{" "}
                <span className="text-terminal-amber">AGGRESSIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-terminal-muted text-sm">
        <div className="command-line justify-center">
          CostGuardian v1.0.0 | AWS Cost Optimization Terminal
        </div>
      </footer>
    </div>
  );
}

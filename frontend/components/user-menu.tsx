"use client";

import { X } from "lucide-react";

interface UserMenuProps {
  onClose: () => void;
  data: any;
}

export default function UserMenu({ onClose, data }: UserMenuProps) {
  const config = data?.config || {};
  const overview = data?.overview || {};

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div
        className="absolute right-0 top-20 w-80 bg-[#1d2d50] border border-[#64ffda] rounded-lg p-6 shadow-2xl terminal-glow m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[#64ffda] font-mono font-bold">Account Info</h2>
          <button
            onClick={onClose}
            className="text-[#8892b0] hover:text-[#64ffda]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div className="text-[#8892b0] text-sm font-mono">
              GitHub Username
            </div>
            <div className="text-[#64ffda] font-mono font-bold">
              @{config.github_username || "your-username"}
            </div>
          </div>

          <div>
            <div className="text-[#8892b0] text-sm font-mono">
              AWS Account ID
            </div>
            <div className="text-[#64ffda] font-mono font-bold">
              {config.aws_account_id || "941431936794"}
            </div>
          </div>

          <div>
            <div className="text-[#8892b0] text-sm font-mono">AWS Region</div>
            <div className="text-[#64ffda] font-mono font-bold">
              {config.aws_region || "us-east-1"}
            </div>
          </div>

          <div className="pt-4 border-t border-[#233554]">
            <div className="text-[#8892b0] text-sm font-mono">
              Total Monthly Savings
            </div>
            <div className="text-[#00ff88] font-mono font-bold text-2xl">
              ${overview.monthly_savings?.toFixed(2) || "0.00"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

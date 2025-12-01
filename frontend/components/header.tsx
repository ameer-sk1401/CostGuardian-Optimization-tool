"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import UserMenu from "./user-menu";

export default function Header({ data }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <>
      <header className="bg-[#112240] border-b border-[#233554] sticky top-0 z-40 backdrop-blur-sm bg-opacity-90">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="text-3xl">💰</div>
              <div>
                <h1 className="text-2xl font-bold text-[#64ffda] font-mono">
                  COSTGUARDIAN
                </h1>
                <p className="text-xs text-[#8892b0] font-mono">
                  Designed to optimize resources in AWS
                </p>
              </div>
            </div>

            {/* Desktop User Icon */}
            <button
              onClick={() => setShowUserMenu(true)}
              className="hidden md:flex items-center space-x-2 bg-[#1d2d50] hover:bg-[#233554] border border-[#64ffda] rounded-lg px-4 py-2 transition-all hover:shadow-lg hover:shadow-[#64ffda]/20 cursor-pointer"
              aria-label="Open user menu"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#64ffda] to-[#00d9ff] flex items-center justify-center">
                <span className="text-[#0a192f] font-bold text-sm">
                  {data?.config?.github_username?.charAt(0).toUpperCase() ||
                    "U"}
                </span>
              </div>
              <span className="text-[#64ffda] font-mono text-sm">
                {data?.config?.github_username || "Account"}
              </span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden text-[#64ffda] hover:text-[#00ff88] transition"
              aria-label="Toggle menu"
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {showMobileMenu && (
            <div className="md:hidden mt-4 pt-4 border-t border-[#233554]">
              <button
                onClick={() => {
                  setShowUserMenu(true);
                  setShowMobileMenu(false);
                }}
                className="w-full flex items-center space-x-3 bg-[#1d2d50] hover:bg-[#233554] border border-[#64ffda] rounded-lg px-4 py-3 transition cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#64ffda] to-[#00d9ff] flex items-center justify-center">
                  <span className="text-[#0a192f] font-bold">
                    {data?.config?.github_username?.charAt(0).toUpperCase() ||
                      "U"}
                  </span>
                </div>
                <div className="text-left">
                  <div className="text-[#64ffda] font-mono font-bold">
                    {data?.config?.github_username || "Account"}
                  </div>
                  <div className="text-[#8892b0] text-xs font-mono">
                    View account info
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* User Menu Modal */}
      {showUserMenu && (
        <UserMenu onClose={() => setShowUserMenu(false)} data={data} />
      )}
    </>
  );
}

"use client"
import { User } from "lucide-react"

export default function Header({ userMenuOpen, setUserMenuOpen }) {
  return (
    <header className="border-b border-[#233554] bg-[#0a192f]/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-[#64ffda] text-3xl font-mono font-bold glow-text">💰 COSTGUARDIAN</div>
            <div className="hidden md:block text-[#8892b0] text-sm font-light">
              Designed to optimize resources in AWS
            </div>
          </div>

          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="terminal-glow p-2 rounded-lg bg-[#1d2d50] hover:bg-[#233554] transition-colors"
          >
            <User size={24} className="text-[#64ffda]" />
          </button>
        </div>
      </div>
    </header>
  )
}

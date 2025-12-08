import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'terminal-dark': '#0a0e1a',
        'terminal-light': '#1a1f2e',
        'terminal-green': '#00ff88',
        'terminal-cyan': '#64ffda',
        'terminal-amber': '#ffd700',
        'terminal-red': '#ff5555',
        'terminal-text': '#e0e0e0',
        'terminal-muted': '#8892b0',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config;

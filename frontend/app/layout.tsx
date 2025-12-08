import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "CostGuardian | AWS Cost Optimization Terminal",
  description:
    "Terminal-themed AWS cost optimization dashboard. Monitor, analyze, and eliminate cloud waste automatically.",
  keywords: ["AWS", "Cost Optimization", "Cloud", "Terminal", "DevOps"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${jetbrainsMono.variable} font-mono antialiased`}>
        {children}
      </body>
    </html>
  );
}

"use client"

import { useEffect, useState } from "react"
import { DollarSign, Trash2, AlertCircle } from "lucide-react"
import MetricCard from "./metric-card"

export default function MetricsOverview({ data }) {
  const [animatedValues, setAnimatedValues] = useState({
    monthlySavings: 0,
    annualSavings: 0,
    deletedResources: 0,
    idleResources: 0,
  })

  useEffect(() => {
    const animationDuration = 1000
    const steps = 30
    const stepDuration = animationDuration / steps

    const monthlyTarget = data?.overview?.monthly_savings || 39.0
    const annualTarget = data?.overview?.annual_savings || 468.0
    const deletedTarget = data?.overview?.resources_deleted || 3
    const idleTarget = data?.overview?.idle_resources || 2

    let currentStep = 0
    const interval = setInterval(() => {
      currentStep++
      const progress = currentStep / steps

      setAnimatedValues({
        monthlySavings: monthlyTarget * progress,
        annualSavings: annualTarget * progress,
        deletedResources: Math.floor(deletedTarget * progress),
        idleResources: Math.floor(idleTarget * progress),
      })

      if (currentStep >= steps) {
        clearInterval(interval)
      }
    }, stepDuration)

    return () => clearInterval(interval)
  }, [data])

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Monthly Savings"
        value={`$${animatedValues.monthlySavings.toFixed(2)}`}
        icon={<DollarSign className="text-[#64ffda]" />}
        color="cyan"
      />
      <MetricCard
        title="Annual Savings"
        value={`$${animatedValues.annualSavings.toFixed(2)}`}
        icon={<DollarSign className="text-[#00ff88]" />}
        color="green"
      />
      <MetricCard
        title="Deleted Resources"
        value={animatedValues.deletedResources.toString()}
        icon={<Trash2 className="text-[#ffd700]" />}
        color="yellow"
      />
      <MetricCard
        title="Idle Resources"
        value={animatedValues.idleResources.toString()}
        icon={<AlertCircle className="text-[#ff5555]" />}
        color="red"
      />
    </div>
  )
}

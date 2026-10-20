import React from 'react'
import { Loader2 } from 'lucide-react'

export const DashboardSkeleton: React.FC<{ title?: string }> = ({ title = 'Loading Dashboard' }) => {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Top Header Skeleton */}
      <div className="h-14 border-b border-slate-200 px-6 flex items-center justify-between bg-white shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 animate-pulse" />
          <div className="h-4 w-32 rounded bg-slate-100 animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-7 w-24 rounded-lg bg-slate-100 animate-pulse" />
          <div className="h-7 w-20 rounded-lg bg-slate-100 animate-pulse" />
        </div>
      </div>

      {/* Main Skeleton */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-center p-12 flex-col gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-600">{title}...</p>
        </div>

        <div className="h-44 rounded-2xl bg-white border border-slate-200 shadow-2xs animate-pulse" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="h-32 rounded-xl bg-white border border-slate-200 shadow-2xs animate-pulse" />
          <div className="h-32 rounded-xl bg-white border border-slate-200 shadow-2xs animate-pulse" />
          <div className="h-32 rounded-xl bg-white border border-slate-200 shadow-2xs animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export default DashboardSkeleton

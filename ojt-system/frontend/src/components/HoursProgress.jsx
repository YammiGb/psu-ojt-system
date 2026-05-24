export default function HoursProgress({ rendered, required, label = 'Hours Progress' }) {
  const pct = required > 0 ? Math.min(100, (rendered / required) * 100) : 0
  const color = pct >= 60 
    ? 'bg-gradient-to-r from-blue-600 to-sky-400' 
    : pct >= 30 
      ? 'bg-gradient-to-r from-amber-500 to-yellow-400' 
      : 'bg-gradient-to-r from-red-500 to-rose-400'

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className="text-gray-800 font-semibold">{rendered}h / {required}h</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-1 text-right">{pct.toFixed(1)}% complete</p>
    </div>
  )
}

export default function LoadingSpinner({ text = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      <p className="text-gray-500 text-sm">{text}</p>
    </div>
  )
}

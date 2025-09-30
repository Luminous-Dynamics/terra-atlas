'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">Error</h1>
        <h2 className="text-2xl mb-4">Something went wrong!</h2>
        <p className="text-gray-400 mb-8">{error.message}</p>
        <button
          onClick={reset}
          className="inline-block px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg hover:opacity-90 transition mr-4"
        >
          Try again
        </button>
        <a 
          href="/"
          className="inline-block px-6 py-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
        >
          Go home
        </a>
      </div>
    </div>
  )
}
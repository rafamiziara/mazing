'use client'

import { useEffect } from 'react'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-8">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-extrabold mb-4">Oops!</h1>
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="text-gray-400 mb-8">The application encountered an unexpected error. Don&apos;t worry, you can try again.</p>
        <button
          onClick={() => reset()}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={() => (window.location.href = '/')}
          className="ml-4 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  )
}

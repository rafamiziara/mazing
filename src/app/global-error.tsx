'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-8">
          <div className="max-w-md text-center">
            <h1 className="text-6xl font-extrabold mb-4">Critical Error</h1>
            <h2 className="text-2xl font-bold mb-4">Something went seriously wrong</h2>
            <p className="text-gray-400 mb-8">
              A critical error occurred. Please refresh the page or contact support if the problem persists.
            </p>
            <button
              onClick={() => reset()}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="ml-4 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

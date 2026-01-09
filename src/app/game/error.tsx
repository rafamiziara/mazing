'use client'

import { useEffect } from 'react'

export default function GameError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Game error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-8">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-extrabold mb-4">Game Error</h1>
        <h2 className="text-2xl font-bold mb-4">Maze malfunction detected!</h2>
        <p className="text-gray-400 mb-2">The game encountered an error and couldn&apos;t continue.</p>
        <p className="text-sm text-gray-500 mb-8 font-mono">{error.message}</p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
          >
            Restart Game
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  )
}

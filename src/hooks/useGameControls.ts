import { Body } from 'matter-js'
import { useCallback, useEffect, useRef } from 'react'

interface UseGameControlsProps {
  ballBody: Body | undefined
  stage: number
  isActive: boolean // Only listen when game is running
}

const VELOCITY_VARIATION = 20

const useGameControls = ({ ballBody, stage, isActive }: UseGameControlsProps) => {
  const handlersRef = useRef<Map<string, (event: KeyboardEvent) => void>>(new Map())

  const createKeyHandler = useCallback(
    (ball: Body, currentStage: number) => {
      return (event: KeyboardEvent) => {
        // Prevent default for arrow keys to avoid page scrolling
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
          event.preventDefault()
        }

        if (!ball || !isActive) return

        const { x, y } = ball.velocity
        const changeSpeed = VELOCITY_VARIATION - currentStage

        switch (event.key) {
          case 'ArrowUp':
            Body.setVelocity(ball, { x, y: y - changeSpeed })
            break
          case 'ArrowRight':
            Body.setVelocity(ball, { x: x + changeSpeed, y })
            break
          case 'ArrowDown':
            Body.setVelocity(ball, { x, y: y + changeSpeed })
            break
          case 'ArrowLeft':
            Body.setVelocity(ball, { x: x - changeSpeed, y })
            break
          default:
            break
        }
      }
    },
    [isActive]
  )

  useEffect(() => {
    const handlers = handlersRef.current

    if (!ballBody || !isActive) {
      // Clean up any existing listeners
      handlers.forEach((handler, key) => {
        document.removeEventListener('keydown', handler)
        handlers.delete(key)
      })
      return
    }

    // Create unique handler for this ball/stage combination
    const handlerKey = `${ballBody.id}-${stage}`

    // Remove old handler if exists
    const oldHandler = handlers.get(handlerKey)
    if (oldHandler) {
      document.removeEventListener('keydown', oldHandler)
    }

    // Create and add new handler
    const newHandler = createKeyHandler(ballBody, stage)
    handlers.set(handlerKey, newHandler)
    document.addEventListener('keydown', newHandler)

    // Cleanup function
    return () => {
      const handler = handlers.get(handlerKey)
      if (handler) {
        document.removeEventListener('keydown', handler)
        handlers.delete(handlerKey)
      }
    }
  }, [ballBody, stage, isActive, createKeyHandler])

  // Cleanup all handlers on unmount
  useEffect(() => {
    const handlers = handlersRef.current

    return () => {
      handlers.forEach((handler) => {
        document.removeEventListener('keydown', handler)
      })
      handlers.clear()
    }
  }, [])
}

export default useGameControls

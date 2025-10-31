import { useCollisionDetection, useGameControls, useMatterEngine, useStageBuilder } from '@/hooks'
import { GameStatus } from '@/types'
import { Body } from 'matter-js'
import { useCallback, useEffect, useState } from 'react'

const useMaze = (canvas: HTMLCanvasElement | null, currentStage: number = 0) => {
  const [status, setStatus] = useState<GameStatus>('initializing')

  const width = window.innerWidth
  const height = window.innerHeight - 80

  // Initialize Matter.js physics engine
  const { engine, world, isReady } = useMatterEngine({ canvas, width, height })

  // Build stage elements (borders, walls, goal, ball)
  const {
    buildStage: buildStageElements,
    clearStage: clearStageElements,
    stageComposite,
    ballBody,
  } = useStageBuilder({ engine, world, width, height })

  // Handle collision detection
  useCollisionDetection({
    engine,
    stageComposite,
    onGoalReached: useCallback(() => setStatus('finished'), []),
  })

  // Handle game controls
  useGameControls({
    ballBody,
    stage: currentStage,
    isActive: status === 'running' || status === 'finished',
  })

  useEffect(() => {
    // Update status when engine is ready
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isReady && status === 'initializing') setStatus('ready')
  }, [isReady, status])

  const buildStage = useCallback(
    (stage: number) => {
      buildStageElements(stage)
      setStatus('running')
    },
    [buildStageElements]
  )

  const clearStage = useCallback(() => {
    clearStageElements()
    setStatus('ready')
  }, [clearStageElements])

  const playGame = useCallback(() => {
    setStatus('running')
    if (ballBody) Body.setStatic(ballBody, false)
  }, [ballBody])

  const pauseGame = useCallback(() => {
    setStatus('paused')
    if (ballBody) Body.setStatic(ballBody, true)
  }, [ballBody])

  return { status, clearStage, buildStage, playGame, pauseGame } as const
}

export default useMaze

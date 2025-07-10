'use client'
import { GameLevel } from '@/types'
import { addBallMovement, addWinCondition, buildBall, buildGoal, buildWalls, createWorld, getStage } from '@/utils/maze'
import { World } from 'matter-js'
import { useCallback, useEffect, useRef, useState } from 'react'
import Message from './message'

type Props = {
  level: GameLevel
  start: () => void
  pause: () => void
  time: number
}

export default function Maze({ level, start, pause, time }: Props) {
  const [finished, setFinished] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const onFinished = useCallback(() => {
    setFinished(true)
    pause()
  }, [pause])

  useEffect(() => {
    if (typeof window !== 'undefined' && canvasRef.current !== null && !finished) {
      generateMaze(getStage(level), onFinished, canvasRef.current)
      start()
    }
  }, [level, onFinished, start, finished])

  return (
    <>
      <canvas ref={canvasRef} />
      {finished && <Message time={time} />}
    </>
  )
}

const generateMaze = (stage: number, onFinished: () => void, canvas: HTMLCanvasElement) => {
  // Create world
  const { engine, height, width, world } = createWorld(canvas)

  // Build walls
  const { walls, unitLengthX, unitLengthY } = buildWalls(stage, width, height)

  // Build goal
  const goal = buildGoal(width, height, unitLengthX, unitLengthY)

  // Build ball
  const ball = buildBall(unitLengthX, unitLengthY)

  // Add bodies into the world
  World.add(world, [...walls, goal, ball])

  // Add ball movement
  addBallMovement(ball, stage)

  // Add win condition
  addWinCondition(engine, onFinished)
}

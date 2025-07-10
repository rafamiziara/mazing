'use client'
import { addBallMovement, addWinCondition, buildBall, buildGoal, buildWalls, createWorld } from '@/utils/maze'
import { World } from 'matter-js'
import { useCallback, useEffect, useRef, useState } from 'react'
import Message from './message'

type Props = {
  stage: number
  start: () => void
  pause: () => void
  reset: () => void
  time: number
}

export default function Maze({ stage, start, pause, time }: Props) {
  const [finished, setFinished] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const onFinished = useCallback(() => {
    setFinished(true)
    pause()
  }, [pause])

  useEffect(() => {
    if (typeof window !== 'undefined' && canvasRef.current !== null && !finished) {
      generateMaze(stage, onFinished, canvasRef.current)
      start()
    }
  }, [stage, onFinished, start, finished])

  return (
    <>
      <canvas ref={canvasRef} />
      {finished && <Message time={time} stage={stage} />}
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

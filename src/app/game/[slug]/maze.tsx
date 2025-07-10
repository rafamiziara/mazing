'use client'
import { addBallMovement, addWinCondition, buildBall, buildGoal, buildWalls, createWorld, getLevel } from '@/utils/maze'
import { World } from 'matter-js'
import { memo, useEffect, useRef } from 'react'

type Props = {
  onFinished: () => void
  level: string
}

export default memo(function Maze({ onFinished, level }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && canvasRef.current !== null) {
      generateMaze(getLevel(level), onFinished, canvasRef.current)
    }
  }, [onFinished, level])

  return <canvas ref={canvasRef} />
})

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
  addBallMovement(ball)

  // Add win condition
  addWinCondition(engine, onFinished)
}

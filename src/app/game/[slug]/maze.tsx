'use client'
import { addBallMovement, addWinCondition, buildBall, buildGoal, buildWalls, createWorld } from '@/utils/maze'
import { World } from 'matter-js'

type Props = {
  onFinished: () => void
}

export default function Maze({ onFinished }: Props) {
  if (typeof window !== 'undefined') {
    generateMaze(10, onFinished)
  }

  return <></>
}

const generateMaze = (stage: number, onFinished: () => void) => {
  // Create world
  const { engine, height, width, world, render } = createWorld()

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

  return { engine, world, render }
}

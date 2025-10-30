import useGameControls from '@/hooks/useGameControls'
import { GameStatus } from '@/types'
import { shuffle } from '@/utils'
import { Bodies, Body, Composite, Engine, Events, Render, Runner, World } from 'matter-js'
import { useCallback, useEffect, useState } from 'react'

const INITIAL_H = 6
const INITIAL_B = 6

const useMaze = (canvas: HTMLCanvasElement | null, currentStage: number = 0) => {
  const [status, setStatus] = useState<GameStatus>('initializing')
  const [ballBody, setBallBody] = useState<Body>()
  const [stageComposite, setStageComposite] = useState(Composite.create({ label: 'stage' }))
  const [engine, setEngine] = useState<Engine | null>(null)

  useGameControls({
    ballBody,
    stage: currentStage,
    isActive: status === 'running' || status === 'finished',
  })

  const world = engine?.world
  const width = window.innerWidth
  const height = window.innerHeight - 80

  const init = useCallback(() => {
    if (!engine) setEngine(Engine.create())

    if (engine && status === 'initializing') {
      const render = Render.create({ canvas: canvas ?? undefined, engine, options: { wireframes: false, width, height } })
      Render.run(render)
      Runner.run(Runner.create(), engine)
      setStatus('ready')
    }
  }, [engine, status, canvas, width, height])

  useEffect(() => {
    if (status === 'initializing') init()
  }, [init, status])

  const buildBorders = useCallback(
    (stage: number) => {
      if (world) {
        const border = INITIAL_B * Math.pow(0.95, stage) * 5
        const borderOptions = { label: 'border', isStatic: true, render: { fillStyle: '#5B6C5D' } }

        const borders = [
          Bodies.rectangle(width / 2, 0, width, border, borderOptions),
          Bodies.rectangle(width / 2, height, width, border, borderOptions),
          Bodies.rectangle(0, height / 2, border, height, borderOptions),
          Bodies.rectangle(width, height / 2, border, height, borderOptions),
        ]

        World.add(world, borders)
      }
    },
    [height, width, world]
  )

  const buildWalls = useCallback(
    (stage: number) => {
      if (stageComposite) {
        const cellsHorizontal = INITIAL_H + 2 * stage
        const cellsVertical = cellsHorizontal / 2
        const unitLengthX = width / cellsHorizontal
        const unitLengthY = height / cellsVertical
        const wallsSize = (INITIAL_B * Math.pow(0.95, stage) * 5) / 3
        const walls: Body[] = []

        const verticals = Array(cellsVertical)
          .fill(null)
          .map(() => Array(cellsHorizontal - 1).fill(false))

        const horizontals = Array(cellsVertical - 1)
          .fill(null)
          .map(() => Array(cellsHorizontal).fill(false))

        const grid = Array(cellsVertical)
          .fill(null)
          .map(() => Array(cellsHorizontal).fill(false))

        const stepThroughtCell = (grid: boolean[][], row: number, column: number) => {
          // If I have visited the cell at [row, column], then return
          if (grid[row][column]) return

          // Mark this cell as being visited
          grid[row][column] = true

          // Assemble randomly-ordered list of neighbors
          const neighbors = shuffle([
            [row - 1, column, 'up'],
            [row, column + 1, 'right'],
            [row + 1, column, 'down'],
            [row, column - 1, 'left'],
          ])

          // For each neighbor...
          for (const neighbor of neighbors) {
            const [nextRow, nextColumn, direction] = neighbor

            // See if that neighbor is out of bounds
            if (nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal) continue

            // If we have visited that neighbor, continue to next neighbor
            if (grid[nextRow][nextColumn]) continue

            // Remove a wall from either horizontals or verticals
            switch (direction) {
              case 'left':
                verticals[row][column - 1] = true
                break
              case 'right':
                verticals[row][column] = true
                break
              case 'up':
                horizontals[row - 1][column] = true
                break
              case 'down':
                horizontals[row][column] = true
                break
            }

            stepThroughtCell(grid, nextRow, nextColumn)
          }

          // Visit the next cell
        }

        const startRow = Math.floor(Math.random() * cellsVertical)
        const startColumn = Math.floor(Math.random() * cellsHorizontal)
        stepThroughtCell(grid, startRow, startColumn)

        // Walls

        horizontals.forEach((row, rowIndex) => {
          row.forEach((open, columnIndex) => {
            if (open) return

            const wall = Bodies.rectangle(
              columnIndex * unitLengthX + unitLengthX / 2,
              rowIndex * unitLengthY + unitLengthY,
              unitLengthX,
              wallsSize,
              {
                label: 'wall',
                render: { fillStyle: '#5B6C5D' },
              }
            )

            Body.setStatic(wall, true)
            walls.push(wall)
          })
        })

        verticals.forEach((row, rowIndex) => {
          row.forEach((open, columnIndex) => {
            if (open) return

            const wall = Bodies.rectangle(
              columnIndex * unitLengthX + unitLengthX,
              rowIndex * unitLengthY + unitLengthY / 2,
              wallsSize,
              unitLengthY,
              {
                label: 'wall',
                render: { fillStyle: '#5B6C5D' },
              }
            )

            Body.setStatic(wall, true)
            walls.push(wall)
          })
        })

        Composite.add(stageComposite, walls)
      }
    },
    [height, stageComposite, width]
  )

  const buildGoal = useCallback(
    (stage: number) => {
      if (stageComposite) {
        const cellsHorizontal = INITIAL_H + 2 * stage
        const cellsVertical = cellsHorizontal / 2
        const unitLengthX = width / cellsHorizontal
        const unitLengthY = height / cellsVertical

        const goal = Bodies.rectangle(width - unitLengthX / 2, height - unitLengthY / 2, unitLengthX * 0.5, unitLengthY * 0.5, {
          label: 'goal',
          render: { fillStyle: '#87A330' },
        })

        Body.setStatic(goal, true)

        Composite.add(stageComposite, goal)
      }
    },
    [height, width, stageComposite]
  )

  const buildBall = useCallback(
    (stage: number) => {
      if (engine && stageComposite) {
        const cellsHorizontal = INITIAL_H + 2 * stage
        const cellsVertical = cellsHorizontal / 2
        const unitLengthX = width / cellsHorizontal
        const unitLengthY = height / cellsVertical

        const ballRadius = Math.min(unitLengthX, unitLengthY) / 4
        const ball = Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, {
          label: 'ball',
          render: { fillStyle: '#56E39F' },
        })

        setBallBody(ball)

        Composite.add(stageComposite, ball)

        Events.on(engine, 'collisionStart', (event) => {
          event.pairs.forEach(({ bodyA, bodyB }) => {
            const labels = ['ball', 'goal']

            if (labels.includes(bodyA.label) && labels.includes(bodyB.label)) {
              engine.gravity.y = 1

              stageComposite.bodies.forEach((body) => {
                if (['wall', 'goal'].includes(body.label)) Body.setStatic(body, false)
              })

              setStatus('finished')
            }
          })
        })
      }
    },
    [engine, stageComposite, width, height]
  )

  const buildStage = useCallback(
    (stage: number) => {
      if (engine && world && stageComposite) {
        engine.gravity.y = 0
        buildBorders(stage)
        buildWalls(stage)
        buildGoal(stage)
        buildBall(stage)

        World.addComposite(world, stageComposite)
        setStatus('running')
      }
    },
    [buildBall, buildBorders, buildGoal, buildWalls, engine, stageComposite, world]
  )

  const clearStage = useCallback(() => {
    if (world && engine) {
      Composite.clear(world, false)
      setStageComposite(Composite.create({ label: 'stage' }))
      setStatus('ready')
    }
  }, [world, engine])

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

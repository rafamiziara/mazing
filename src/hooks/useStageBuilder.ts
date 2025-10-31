import { generateMaze } from '@/utils/mazeGenerator'
import { Bodies, Body, Composite, Engine, World } from 'matter-js'
import { useCallback, useState } from 'react'

const INITIAL_H = 6
const INITIAL_B = 6

interface UseStageBuilderProps {
  engine: Engine | null
  world: World | undefined
  width: number
  height: number
}

const useStageBuilder = ({ engine, world, width, height }: UseStageBuilderProps) => {
  const [stageComposite, setStageComposite] = useState(Composite.create({ label: 'stage' }))
  const [ballBody, setBallBody] = useState<Body>()

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
      if (!stageComposite) return

      const cellsHorizontal = INITIAL_H + 2 * stage
      const cellsVertical = cellsHorizontal / 2
      const unitLengthX = width / cellsHorizontal
      const unitLengthY = height / cellsVertical
      const wallsSize = (INITIAL_B * Math.pow(0.95, stage) * 5) / 3
      const walls: Body[] = []

      const { horizontals, verticals } = generateMaze(cellsVertical, cellsHorizontal)

      // Build horizontal walls
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

      // Build vertical walls
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
    },
    [height, stageComposite, width]
  )

  const buildGoal = useCallback(
    (stage: number) => {
      if (!stageComposite) return

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
    },
    [height, width, stageComposite]
  )

  const buildBall = useCallback(
    (stage: number) => {
      if (!stageComposite) return

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
    },
    [stageComposite, width, height]
  )

  const buildStage = useCallback(
    (stage: number) => {
      if (!engine || !world || !stageComposite) return

      // eslint-disable-next-line react-hooks/immutability
      engine.gravity.y = 0
      buildBorders(stage)
      buildWalls(stage)
      buildGoal(stage)
      buildBall(stage)

      World.addComposite(world, stageComposite)
    },
    [buildBall, buildBorders, buildGoal, buildWalls, engine, stageComposite, world]
  )

  const clearStage = useCallback(() => {
    if (!world || !engine) return

    Composite.clear(world, false)
    setStageComposite(Composite.create({ label: 'stage' }))
  }, [world, engine])

  return { buildStage, clearStage, stageComposite, ballBody }
}

export default useStageBuilder

import { Bodies, Body, Engine, Events, Render, Runner } from 'matter-js'

export const getLevel = (level: string) => {
  switch (level) {
    case 'easy':
      return 0
    case 'medium':
      return 5
    case 'hard':
      return 10
    case 'super-hard':
      return 15
    default:
      return 0
  }
}

export const shuffle = (arr: [number, number, string][]) => {
  let counter = arr.length

  while (counter > 0) {
    const index = Math.floor(Math.random() * counter)

    counter--

    const temp = arr[counter]
    arr[counter] = arr[index]
    arr[index] = temp
  }

  return arr
}

export const createWorld = (canvas: HTMLCanvasElement) => {
  const engine = Engine.create()
  engine.gravity.y = 0

  const width = window.innerWidth * 0.99
  const height = window.innerHeight * 0.9

  const render = Render.create({ canvas, engine, options: { wireframes: false, width, height } })

  Render.run(render)
  Runner.run(Runner.create(), engine)
  const { world } = engine

  return { engine, world, width, height }
}

export const buildWalls = (stage: number, width: number, height: number) => {
  const initialH = 6
  const cellsHorizontal = initialH + 2 * stage
  const cellsVertical = cellsHorizontal / 2

  const initialB = 8
  const border = initialB * Math.pow(0.95, stage)
  const wallsSize = border / 2

  const walls = [
    Bodies.rectangle(width / 2, 0, width, border, { label: 'border', isStatic: true, render: { fillStyle: '#5B6C5D' } }),
    Bodies.rectangle(width / 2, height, width, border, { label: 'border', isStatic: true, render: { fillStyle: '#5B6C5D' } }),
    Bodies.rectangle(0, height / 2, border, height, { label: 'border', isStatic: true, render: { fillStyle: '#5B6C5D' } }),
    Bodies.rectangle(width, height / 2, border, height, { label: 'border', isStatic: true, render: { fillStyle: '#5B6C5D' } }),
  ]

  const verticals = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal - 1).fill(false))

  const horizontals = Array(cellsVertical - 1)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false))

  const grid = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false))

  const stepThroughtCell = (row: number, column: number) => {
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

      stepThroughtCell(nextRow, nextColumn)
    }

    // Visit the next cell
  }

  const startRow = Math.floor(Math.random() * cellsVertical)
  const startColumn = Math.floor(Math.random() * cellsHorizontal)
  stepThroughtCell(startRow, startColumn)

  // Walls
  const unitLengthX = width / cellsHorizontal
  const unitLengthY = height / cellsVertical

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
          isStatic: true,
          render: { fillStyle: '#5B6C5D' },
        }
      )

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
          isStatic: true,
          render: { fillStyle: '#5B6C5D' },
        }
      )

      walls.push(wall)
    })
  })

  return { walls, unitLengthX, unitLengthY }
}

export const buildGoal = (width: number, height: number, unitLengthX: number, unitLengthY: number) => {
  return Bodies.rectangle(width - unitLengthX / 2, height - unitLengthY / 2, unitLengthX * 0.5, unitLengthY * 0.5, {
    label: 'goal',
    isStatic: true,
    render: { fillStyle: '#87A330' },
  })
}

export const buildBall = (unitLengthX: number, unitLengthY: number) => {
  const ballRadius = Math.min(unitLengthX, unitLengthY) / 4
  return Bodies.circle(unitLengthX / 2, unitLengthY / 2, ballRadius, { label: 'ball', render: { fillStyle: '#56E39F' } })
}

export const addBallMovement = (ball: Body) => {
  document.addEventListener('keydown', (event) => {
    const { x, y } = ball.velocity

    switch (event.key) {
      case 'ArrowUp':
        Body.setVelocity(ball, { x, y: y - 5 })
        break
      case 'ArrowRight':
        Body.setVelocity(ball, { x: x + 5, y })
        break
      case 'ArrowDown':
        Body.setVelocity(ball, { x, y: y + 5 })
        break
      case 'ArrowLeft':
        Body.setVelocity(ball, { x: x - 5, y })
        break
      default:
        break
    }
  })
}

export const addWinCondition = (engine: Engine, onFinished: () => void) => {
  Events.on(engine, 'collisionStart', (event) => {
    event.pairs.forEach((collision) => {
      const labels = ['ball', 'goal']

      if (labels.includes(collision.bodyA.label) && labels.includes(collision.bodyB.label)) {
        engine.gravity.y = 1

        engine.world.bodies.forEach((body) => {
          if (body.label === 'wall') Body.setStatic(body, false)
        })

        onFinished()
      }
    })
  })
}

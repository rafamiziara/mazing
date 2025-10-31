import { shuffle } from '@/utils'

export interface MazeGrid {
  horizontals: boolean[][]
  verticals: boolean[][]
}

export const generateMaze = (cellsVertical: number, cellsHorizontal: number): MazeGrid => {
  const verticals = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal - 1).fill(false))

  const horizontals = Array(cellsVertical - 1)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false))

  const grid = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false))

  const stepThroughCell = (row: number, column: number) => {
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

      stepThroughCell(nextRow, nextColumn)
    }
  }

  // Start from a random cell
  const startRow = Math.floor(Math.random() * cellsVertical)
  const startColumn = Math.floor(Math.random() * cellsHorizontal)
  stepThroughCell(startRow, startColumn)

  return { horizontals, verticals }
}

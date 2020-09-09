const { Engine, Render, Runner, World, Bodies } = Matter;

const generateMaze = (stage) => {
  const initialH = 6;
  const initialB = 8;
  
  const cellsHorizontal = initialH + (2 * stage);
  const cellsVertical = cellsHorizontal / 2;
  const width = window.innerWidth;
  const height = window.innerHeight * 0.9;
  
  const border = initialB * Math.pow(0.95, stage);
  const wallsSize = border / 2;
  
  const unitLengthX = width / cellsHorizontal;
  const unitLengthY = height / cellsVertical;
  
  const engine = Engine.create();
  engine.world.gravity.y = 0;
  const { world } = engine;
  const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
      wireframes: false,
      width,
      height
    }
  })
  
  Render.run(render);
  Runner.run(Runner.create(), engine);
  
  // Walls
  const walls = [
    Bodies.rectangle(width / 2, 0, width, border, {isStatic: true}),
    Bodies.rectangle(width / 2, height, width, border, {isStatic: true}),
    Bodies.rectangle(0, height / 2, border, height, {isStatic: true}),
    Bodies.rectangle(width, height / 2, border, height, {isStatic: true})
  ]
  World.add(world, walls);
  
  // Maze generation
  const shuffle = (arr) => {
    let counter = arr.length;
  
    while (counter > 0) {
      const index = Math.floor(Math.random() * counter);
  
      counter--;
  
      const temp = arr[counter];
      arr[counter] = arr[index];
      arr[index] = temp;
    }
  
    return arr;
  }
  
  const grid = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false))
  
  const verticals = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal - 1).fill(false))
  
  const horizontals = Array(cellsVertical - 1)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false))
  
  const startRow = Math.floor(Math.random() * cellsVertical);
  const startColumn = Math.floor(Math.random() * cellsHorizontal);
  
  const stepThroughtCell = (row, column) => {
    // If I have visited the cell at [row, column], then return
    if(grid[row][column]) {
      return;
    }
  
    // Mark this cell as being visited
    grid[row][column] = true;
  
    // Assemble randomly-ordered list of neighbors
    const neighbors = shuffle([
      [row - 1, column, 'up'],
      [row, column + 1, 'right'],
      [row + 1, column, 'down'],
      [row, column - 1, 'left']
    ]);
  
    // For each neighbor...
    for (let neighbor of neighbors) {
      const [nextRow, nextColumn, direction] = neighbor;
  
      // See if that neighbor is out of bounds
      if (nextRow < 0 || nextRow >= cellsVertical || nextColumn < 0 || nextColumn >= cellsHorizontal) {
        continue;
      }
  
      // If we have visited that neighbor, continue to next neighbor
      if (grid[nextRow][nextColumn]) {
        continue;
      }
  
      // Remove a wall from either horizontals or verticals
      switch(direction) {
        case 'left': verticals[row][column - 1] = true; break;
        case 'right': verticals[row][column] = true; break;
        case 'up': horizontals[row - 1][column] = true; break;
        case 'down': horizontals[row][column] = true; break;
      }
  
      stepThroughtCell(nextRow, nextColumn);
    }
  
    // Visit the next cell
  }
  
  stepThroughtCell(startRow, startColumn);
  
  
  // Walls
  horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
      if (open) {
        return;
      }
  
      const wall = Bodies.rectangle(
        columnIndex * unitLengthX + unitLengthX / 2,
        rowIndex * unitLengthY + unitLengthY,
        unitLengthX,
        wallsSize,
        {
          label: 'wall',
          isStatic: true,
          render: {
            fillStyle: '#5B6C5D'
          }
        }
      );
      World.add(world, wall);
    })
  });
  
  verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
      if (open) {
        return;
      }
  
      const wall = Bodies.rectangle(
        columnIndex * unitLengthX + unitLengthX,
        rowIndex * unitLengthY + unitLengthY / 2,
        wallsSize,
        unitLengthY,
        {
          label: 'wall',
          isStatic: true,
          render: {
            fillStyle: '#5B6C5D'
          }
        }
      );
      World.add(world, wall);
    })
  })
  
  // Goal
  const goal = Bodies.rectangle(
    width - unitLengthX / 2,
    height - unitLengthY / 2,
    unitLengthX * 0.5,
    unitLengthY * 0.5,
    {
      label: 'goal',
      isStatic: true,
      render: {
        fillStyle: '#87A330'
      }
    }
  );
  World.add(world, goal);
  
  // Ball
  const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
  const ball = Bodies.circle(
    unitLengthX / 2,
    unitLengthY / 2,
    ballRadius,
    {
      label: 'ball',
      render: {
        fillStyle: '#56E39F'
      }
    }
  )
  World.add(world, ball);

  return { engine, ball }
};

const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const difficult = document.body.getAttribute('dif');

let stage = parseInt(localStorage.getItem('stage'));
let limit = parseInt(localStorage.getItem('limit'));

if (!stage) {
	switch(difficult) {
		case 'easy':
			stage = 0;
			limit = 5;
			break;
		case 'medium':
			stage = 5;
			limit = 10;
			break;
		case 'hard':
			stage = 10;
			limit = 15;
			break;
		case 'super-hard':
			stage = 15;
			limit = 20;
			break;
	}
}

localStorage.setItem('limit', limit);

const initialH = 6;
const initialB = 8;

const timerPage = document.querySelector(".timer");

const timer = {
	timerCount: 0,
	intervalId: 0,

	refreshTimer() {
		let seconds, minutes;
		timer.timerCount++;
		seconds = ("00" + timer.timerCount % 60).slice(-2);
		minutes = ("00" + Math.floor(timer.timerCount / 60) % 60).slice(-2);
		timerPage.innerText = `${minutes}:${seconds}`;
	},

	playTimer() {
		timer.intervalId = setInterval(timer.refreshTimer, 1000);
	},
	
	stopTimer() {
		clearInterval(timer.intervalId);
	}
}

timer.playTimer();


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
		[row - 1, column, "up"],
		[row, column + 1, "right"],
		[row + 1, column, "down"],
		[row, column - 1, "left"]
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
			case "left": verticals[row][column - 1] = true; break;
			case "right": verticals[row][column] = true; break;
			case "up": horizontals[row - 1][column] = true; break;
			case "down": horizontals[row][column] = true; break;
		}

		stepThroughtCell(nextRow, nextColumn);
	}

	// Visit the next cell
}

stepThroughtCell(startRow, startColumn);

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
				label: "wall",
				isStatic: true,
				render: {
					fillStyle: "#5B6C5D"
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
				label: "wall",
				isStatic: true,
				render: {
					fillStyle: "#5B6C5D"
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
		label: "goal",
		isStatic: true,
		render: {
			fillStyle: "#87A330"
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
		label: "ball",
		render: {
			fillStyle: "#56E39F"
		}
	}
)
World.add(world, ball);

document.addEventListener("keydown", event => {
	const { x, y } = ball.velocity;

	switch (event.keyCode) {
		case 38: Body.setVelocity(ball, { x, y: y - 5}); break;
		case 39: Body.setVelocity(ball, { x: x + 5, y}); break;
		case 40: Body.setVelocity(ball, { x, y: y + 5}); break;
		case 37: Body.setVelocity(ball, { x: x - 5, y}); break;
		default: break;
	}
})

// Win condition

Events.on(engine, "collisionStart", event => {
	event.pairs.forEach((collision) => {
		const labels = ["ball", "goal"]

		if (
			labels.includes(collision.bodyA.label) &&
			labels.includes(collision.bodyB.label)
		) {
			engine.world.gravity.y = 1;
			engine.world.bodies.forEach( body => {
				if (body.label === "wall") {
					Body.setStatic(body, false);
				}
			})
			timer.stopTimer();
			localStorage.setItem('stage', stage + 1);
			localStorage.setItem(`stage${stage}`, timer.timerCount);
			let message = `You completed this stage in ${timer.timerCount} seconds!`
			document.querySelector(".winner").classList.remove("hidden");

			if (stage >= limit) {
				const s5 = timer.timerCount;
				const s4 = parseInt(localStorage.getItem(`stage${stage-1}`));
				const s3 = parseInt(localStorage.getItem(`stage${stage-2}`));
				const s2 = parseInt(localStorage.getItem(`stage${stage-3}`));
				const s1 = parseInt(localStorage.getItem(`stage${stage-4}`));

				message = `You completed this level in ${s5+s4+s3+s2+s1} seconds`;
				document.querySelector(".winner p").innerText = message;
				return
			}

			document.querySelector(".winner p").innerText = message;
			document.querySelector("button").classList.remove("hidden");
		}
		
	})
})

document.querySelector("button").addEventListener("click", () => {
	location.reload();
});
const { Body, Events } = Matter;

const level = document.body.getAttribute('level');

let stage = parseInt(localStorage.getItem('stage'));
let limit = parseInt(localStorage.getItem('limit'));

if (!stage) {
	switch(level) {
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

const { engine, ball } = generateMaze(stage);
timer.playTimer();

// Ball moviment
document.addEventListener('keydown', event => {
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
Events.on(engine, 'collisionStart', event => {
	event.pairs.forEach((collision) => {
		const labels = ['ball', 'goal']

		if (
			labels.includes(collision.bodyA.label) &&
			labels.includes(collision.bodyB.label)
		) {
			engine.world.gravity.y = 1;
			engine.world.bodies.forEach( body => {
				if (body.label === 'wall') {
					Body.setStatic(body, false);
				}
			})
			timer.stopTimer();
			localStorage.setItem('stage', stage + 1);
			localStorage.setItem(`stage${stage}`, timer.timerCount);
			let message = `You completed this stage in ${timer.timerCount} seconds!`
			document.querySelector('.winner').classList.remove('hidden');

			if (stage >= limit) {
				const s5 = timer.timerCount;
				const s4 = parseInt(localStorage.getItem(`stage${stage-1}`));
				const s3 = parseInt(localStorage.getItem(`stage${stage-2}`));
				const s2 = parseInt(localStorage.getItem(`stage${stage-3}`));
				const s1 = parseInt(localStorage.getItem(`stage${stage-4}`));

				message = `You completed this level in ${s5+s4+s3+s2+s1} seconds`;
				document.querySelector('.winner p').innerText = message;
				return
			}

			document.querySelector('.winner p').innerText = message;
			document.querySelector('button').classList.remove('hidden');
		}
		
	})
})

// Button to next stage
document.querySelector('button').addEventListener('click', () => {
	location.reload();
});
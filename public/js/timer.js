const timerPage = document.querySelector('.timer');

const timer = {
	timerCount: 0,
	intervalId: 0,

	refreshTimer() {
		let seconds, minutes;
		timer.timerCount++;
		seconds = ('00' + timer.timerCount % 60).slice(-2);
		minutes = ('00' + Math.floor(timer.timerCount / 60) % 60).slice(-2);
		timerPage.innerText = `${minutes}:${seconds}`;
	},

	playTimer() {
		timer.intervalId = setInterval(timer.refreshTimer, 1000);
	},
	
	stopTimer() {
		clearInterval(timer.intervalId);
	}
}
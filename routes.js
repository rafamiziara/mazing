const express = require('express');
const router = express.Router();

const homeView = require('./views/home');
const gameView = require('./views/game');

router.get('/', (req, res) => {
  res.send(homeView());
});

router.get('/game/:level', (req, res) => {
  res.send(gameView({ level: req.params.level }));
});

module.exports = router;
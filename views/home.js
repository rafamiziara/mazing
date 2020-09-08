const layout = require('./layout');

module.exports = () => {
  return layout({
    content: `
      <div class="logo">mazing</div>
      <div class="select-game">
        <a class="box" id="easy" href="/game/easy">EASY</a>
        <a class="box" id="medium" href="/game/medium">MEDIUM</a>
        <a class="box" id="hard" href="/game/hard">HARD</a>
        <a class="box" id="super-hard" href="/game/super-hard">SUPER HARD</a>
      </div>
      <script type="text/javascript" src="/js/home.js"></script>
    `
  })
}
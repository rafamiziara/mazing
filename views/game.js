const layout = require('./layout');

module.exports = ({ difficult }) => {
  return layout({
    difficult,
    content: `
      <div class="header">
        <a href="/" class="title">mazing</a>
        <div class="timer">00:00</div>
      </div>
      <div class="winner hidden">
        <h1>Well done!</h1>
        <p></p>
      </div>
      <button id="btn" class="hidden">NEXT STAGE</button>
      <script type="text/javascript" src="/js/index.js"></script>
    `
  })
}
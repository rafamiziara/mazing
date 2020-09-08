module.exports = ({ content, difficult }) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>mazing</title>
        <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.14.2/matter.min.js"></script>
        <link rel="stylesheet" type="text/css" href="/css/style.css">
        <link href="https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap" rel="stylesheet">
      </head>
      <body dif=${difficult}>
        ${content}
      </body>
    </html>
  `
}
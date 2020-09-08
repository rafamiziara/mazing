const express = require('express');
const app = express();

app.use(express.static('public'));

const router = require('./src/routes');
app.use(router);

app.listen(3000, () => {
  console.log('Listening on port 3000!');
});
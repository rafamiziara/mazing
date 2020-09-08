const express = require('express');
const app = express();

app.use(express.static('public'));

const router = require('./routes');
app.use(router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}!`);
});
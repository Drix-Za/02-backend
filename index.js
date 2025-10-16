const express = require('express');
const {testConnection} = require('./db');

const app = express();
testConnection()

app.get('/', (req, res) => {
    res.send('¡Te conectaste!');
});

app.listen(5432, () => {
  console.log("Klk");
});
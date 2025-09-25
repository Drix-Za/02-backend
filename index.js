const express = require('express');
const sequelize = require('./db');

const app = express();
app.use(express.json());

sequelize.authenticate()
  .then(() => console.log("¡Te conectaste!"))
  .catch(err => console.error("Intenta otra vez:", err));

app.listen(5432, () => {
  console.log("Klk");
});
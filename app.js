
//UPDATED APP.JS FILE
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const morgan = require('morgan');
const databaseConnection = require('./src/config/db');
const studentsRoutes = require('./src/routes/student.routes');

const app = express();
const port = process.env.PORT;

dotenv.config();
app.use(morgan('dev'));
app.use(express.json());



databaseConnection();

app.get("/", (req, res) => {
  res.send("Hello World");
});


app.use('/students', studentsRoutes)


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
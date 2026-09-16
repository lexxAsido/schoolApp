const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

require('dotenv').config();
 const url = process.env.MONGODB_URL;
 


const databaseConnection = async () => {
  try {
    await mongoose.connect(url);
    console.log("Database connected successfully");
  } catch (error) {
    console.log("Database connection failed", error);
  }
};

module.exports = databaseConnection;

const mongoose = require('mongoose');
require('dotenv').config();

const dbURI = process.env.MONGO_URI; 

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1); // Exit the process if connection fails
  }
};

module.exports = connectDB;  

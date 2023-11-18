const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
       await mongoose.connect(process.env.uri, {
        useNewUrlParser: true,
        useNewUrlParser: true,
        useUnifiedTopology: true

       });
       console.log("mongodb connected")
  
    } catch (error) {
        console.log(error.message);
        process.exit(1)
    }
  }

module.exports = connectDB

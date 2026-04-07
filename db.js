console.log("My Connection String is:", process.env.MONGO_URI);
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // We use process.env to pull the string from the .env file
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected Successfully!");
    } catch (err) {
        console.error("❌ MongoDB Connection Failed:", err.message);
        process.exit(1); // Stop the server if connection fails
    }
};

module.exports = connectDB;
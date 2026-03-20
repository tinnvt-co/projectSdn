const mongoose = require("mongoose");

let isConnected = false;
let connectionPromise = null;

const connectDB = async () => {
    if (isConnected) return mongoose.connection;
    if (connectionPromise) return connectionPromise;

    connectionPromise = mongoose
        .connect(process.env.MONGO_URI)
        .then((conn) => {
            isConnected = true;
            console.log(`MongoDB connected: ${conn.connection.host}`);
            return conn.connection;
        })
        .catch((error) => {
            connectionPromise = null;
            console.error(`Error: ${error.message}`);
            throw error;
        });

    try {
        return await connectionPromise;
    } catch (error) {
        if (!process.env.VERCEL) {
            process.exit(1);
        }
        throw error;
    }
};

module.exports = connectDB;

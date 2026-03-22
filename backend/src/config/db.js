const mongoose = require("mongoose");

let isConnected = false;
let connectionPromise = null;

const buildFallbackMongoUri = (uri) => {
    if (!uri || !uri.includes("localhost")) return null;
    return uri.replace("localhost", "127.0.0.1");
};

const connectDB = async () => {
    if (isConnected) return mongoose.connection;
    if (connectionPromise) return connectionPromise;

    const primaryUri = process.env.MONGO_URI;
    const fallbackUri = buildFallbackMongoUri(primaryUri);
    const connectOptions = {
        serverSelectionTimeoutMS: 5000,
        ...(primaryUri?.includes("localhost") ? { family: 4 } : {}),
    };

    connectionPromise = (async () => {
        try {
            const conn = await mongoose.connect(primaryUri, connectOptions);
            isConnected = true;
            console.log(`MongoDB connected: ${conn.connection.host}`);
            return conn.connection;
        } catch (error) {
            const shouldRetryWithIpv4 =
                fallbackUri &&
                primaryUri !== fallbackUri &&
                /ECONNREFUSED\s+::1:27017/i.test(error.message);

            if (!shouldRetryWithIpv4) {
                console.error(`Error: ${error.message}`);
                throw error;
            }

            console.warn("MongoDB localhost IPv6 connection failed, retrying with 127.0.0.1");
            const conn = await mongoose.connect(fallbackUri, {
                ...connectOptions,
                family: 4,
            });
            isConnected = true;
            console.log(`MongoDB connected: ${conn.connection.host}`);
            return conn.connection;
        }
    })().catch((error) => {
        connectionPromise = null;
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

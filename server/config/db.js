import mongoose from "mongoose";

async function connectToDB() {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL;
        if (!mongoUri) {
            throw new Error("MONGODB_URI is not configured");
        }

        await Promise.race([
            mongoose.connect(mongoUri, {
                serverSelectionTimeoutMS: 10000,
                connectTimeoutMS: 10000,
                socketTimeoutMS: 10000,
                maxPoolSize: Number(process.env.MONGO_MAX_POOL_SIZE) || 10
            }),
            new Promise((_, reject) => {
                setTimeout(() => reject(new Error("MongoDB connection timed out")), 12000);
            })
        ]);

        if (process.env.NODE_ENV !== "production") {
            console.log("MongoDB connected successfully");
        }
    } catch (err) {
        console.error("DB connection failed:", err.message);
        throw err;
    }
}

async function disconnectFromDB() {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
}

mongoose.connection.on("disconnected", () => {
    if (process.env.NODE_ENV !== "production") {
        console.log("MongoDB disconnected");
    }
});

mongoose.connection.on("error", (error) => {
    console.error("MongoDB error:", error.message);
});

export { disconnectFromDB };
export default connectToDB;

import dns from "dns";
import mongoose from "mongoose";
import logger from "../utils/logger.js";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const connectDB = async (retryCount = 0) => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: process.env.NODE_ENV !== "production",
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: process.env.NODE_ENV === "production" ? 20 : 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      heartbeatFrequencyMS: 10000,
    });

    const db = conn.connection.db;
    logger.info(`MongoDB Atlas connected: ${conn.connection.host}/${db.databaseName}`);

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
    });

    mongoose.connection.on("error", (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      logger.warn(
        `MongoDB connection failed (attempt ${retryCount + 1}/${MAX_RETRIES}): ${error.message}. Retrying in ${RETRY_DELAY_MS / 1000}s...`
      );
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDB(retryCount + 1);
    }
    logger.error(`MongoDB connection failed after ${MAX_RETRIES} attempts: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;

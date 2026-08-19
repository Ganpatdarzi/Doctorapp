import multer from "multer";
import logger from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || "Internal Server Error";

  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = "Resource not found";
  }

  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field: ${field}. Please use another value.`;
  }

  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
  }

  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "File is too large. Please upload a smaller file.";
    } else {
      message = `Upload error: ${err.code}`;
    }
  }

  if (err.message === "Not allowed by CORS") {
    statusCode = 403;
    message = "Origin not allowed by CORS policy";
  }

  if (statusCode >= 500) {
    logger.error("Unhandled error", {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      error: err.message,
      stack: err.stack,
    });
  } else {
    logger.warn("Request failed", {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      status: statusCode,
      error: err.message,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};

export default errorHandler;

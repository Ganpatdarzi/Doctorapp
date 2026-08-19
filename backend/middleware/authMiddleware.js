import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Doctor from "../models/Doctor.js";
import { sendError } from "../utils/apiResponse.js";

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return sendError(res, 401, "Not authorized. No token provided.");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === "user") {
      req.user = await User.findById(decoded.id).select("-password");
    } else if (decoded.role === "doctor") {
      req.user = await Doctor.findById(decoded.id).select("-password");
    } else if (decoded.role === "admin") {
      req.user = await User.findById(decoded.id).select("-password");
    }

    if (!req.user) {
      return sendError(res, 401, "Not authorized. User no longer exists.");
    }

    if (decoded.role === "user" && req.user.isActive === false) {
      return sendError(res, 403, "Your account has been deactivated. Please contact the administrator.");
    }

    req.userRole = decoded.role;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return sendError(res, 401, "Token expired. Please login again.");
    }
    if (error.name === "JsonWebTokenError") {
      return sendError(res, 401, "Invalid token. Please login again.");
    }
    return sendError(res, 401, "Not authorized. Token verification failed.");
  }
};

export default protect;

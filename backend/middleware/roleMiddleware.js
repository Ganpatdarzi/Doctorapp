import { sendError } from "../utils/apiResponse.js";

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, "Not authorized. Please login.");
    }

    if (!roles.includes(req.userRole)) {
      return sendError(
        res,
        403,
        `Role '${req.userRole}' is not authorized to access this resource.`
      );
    }

    next();
  };
};

export default authorize;

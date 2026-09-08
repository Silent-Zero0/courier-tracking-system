const { verifyToken } = require("../utils/jwt");

const authSessionModel = require("../models/auth-session.model");

const userModel = require("../models/user.model");

const authenticate = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
    }

    const [scheme, token] = authorization.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication format",
      });
    }

    const decoded = verifyToken(token);

    if (!decoded.jti || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    const session = await authSessionModel.findActiveSessionByJti(decoded.jti);

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Session is invalid or expired",
      });
    }

    if (String(session.user_id) !== String(decoded.userId)) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication session",
      });
    }

    const user = await userModel.findUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found",
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        message: "User account is not active",
      });
    }

    req.user = {
      userId: user.id,
      roleId: user.role_id,
      roleName: user.role_name,
      hubId: user.hub_id,
      jti: decoded.jti,
      sessionId: session.id,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
};

module.exports = {
  authenticate,
};

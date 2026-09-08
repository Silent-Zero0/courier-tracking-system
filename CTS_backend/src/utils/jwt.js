const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
};

const generateToken = (payload) => {
  const jti = crypto.randomBytes(32).toString("hex");

  const expiresIn = process.env.JWT_EXPIRES_IN || "1d";

  const tokenPayload = {
    ...payload,
    jti,
  };

  const token = jwt.sign(tokenPayload, getJwtSecret(), {
    expiresIn,
  });

  const decoded = jwt.decode(token);

  return {
    token,
    jti,
    expiresAt: new Date(decoded.exp * 1000),
  };
};

const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

module.exports = {
  generateToken,
  verifyToken,
};

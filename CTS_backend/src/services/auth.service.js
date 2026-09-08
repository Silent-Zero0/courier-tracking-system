const userModel = require("../models/user.model");
const authSessionModel = require("../models/auth-session.model");

const { hashPassword, comparePassword } = require("../utils/password");

const { generateToken } = require("../utils/jwt");

const registerUser = async ({ name, email, password, phone }) => {
  const existingUser = await userModel.findUserByEmail(email);

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Public registration always creates a CUSTOMER account
  const customerRole = await userModel.findRoleByName("CUSTOMER");

  if (!customerRole) {
    throw new Error("CUSTOMER role not found");
  }

  const passwordHash = await hashPassword(password);

  const user = await userModel.createUser({
    name,
    email,
    passwordHash,
    phone,
    roleId: customerRole.id,
  });

  return user;
};

const loginUser = async ({ email, password }) => {
  const user = await userModel.findUserByEmail(email);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (user.status !== "ACTIVE") {
    throw new Error("User account is not active");
  }

  const passwordMatch = await comparePassword(password, user.password_hash);

  if (!passwordMatch) {
    throw new Error("Invalid email or password");
  }

  const { token, jti, expiresAt } = generateToken({
    userId: user.id,
    roleId: user.role_id,
  });

  await authSessionModel.createSession({
    userId: user.id,
    jti,
    expiresAt,
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      roleId: user.role_id,
      status: user.status,
    },
  };
};

const logoutUser = async ({ jti }) => {
  if (!jti) {
    throw new Error("Session identifier is required");
  }

  const revokedSession = await authSessionModel.revokeSessionByJti(jti);

  if (!revokedSession) {
    throw new Error("Session is already revoked or invalid");
  }

  return {
    sessionId: revokedSession.id,
    revokedAt: revokedSession.revoked_at,
  };
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
};

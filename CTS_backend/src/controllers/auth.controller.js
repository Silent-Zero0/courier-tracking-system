const authService = require("../services/auth.service");
const { validateRegisterInput } = require("../validators/auth.validator");

const { successResponse, errorResponse } = require("../utils/api-response");

const ERROR_CODES = require("../utils/error-codes");

const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // Validate registration input
    const validation = validateRegisterInput({
      name,
      email,
      password,
      phone,
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const user = await authService.registerUser({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      phone,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    if (error.message === "User with this email already exists") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Registration failed",
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await authService.loginUser({
      email: email.trim().toLowerCase(),
      password,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    console.error("Login error:", error.message);

    if (error.message === "Invalid email or password") {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "User account is not active") {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

const logout = async (req, res) => {
  try {
    const result = await authService.logoutUser({
      jti: req.user.jti,
    });

    res.status(200).json({
      success: true,
      message: "Logout successful",
      data: result,
    });
  } catch (error) {
    console.error("Logout error:", error.message);

    if (
      error.message === "Session identifier is required" ||
      error.message === "Session is already revoked or invalid"
    ) {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};

module.exports = {
  register,
  login,
  logout,
};

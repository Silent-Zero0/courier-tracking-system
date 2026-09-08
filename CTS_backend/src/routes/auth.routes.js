const express = require("express");
const authController = require("../controllers/auth.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { allowRoles } = require("../middleware/role.middleware");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authenticate, authController.logout);

router.get("/me", authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Authentication successful",
    data: {
      userId: req.user.userId,
      roleId: req.user.roleId,
      sessionId: req.user.sessionId,
    },
  });
});

router.get(
  "/test-customer",
  authenticate,
  allowRoles("CUSTOMER"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Customer access granted",
      data: {
        userId: req.user.userId,
        roleName: req.user.roleName,
      },
    });
  },
);

router.get("/test-admin", authenticate, allowRoles("ADMIN"), (req, res) => {
  res.status(200).json({
    success: true,
    message: "Admin access granted",
    data: {
      userId: req.user.userId,
      roleName: req.user.roleName,
    },
  });
});

module.exports = router;

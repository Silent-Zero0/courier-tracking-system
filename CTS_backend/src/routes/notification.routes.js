const express = require("express");

const notificationController = require("../controllers/notification.controller");
const { authenticate } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/my", authenticate, notificationController.getMyNotifications);

router.get(
  "/my/unread",
  authenticate,
  notificationController.getMyUnreadNotifications,
);

router.patch(
  "/:notificationId/read",
  authenticate,
  notificationController.markNotificationAsRead,
);

router.patch(
  "/my/read-all",
  authenticate,
  notificationController.markAllNotificationsAsRead,
);

module.exports = router;

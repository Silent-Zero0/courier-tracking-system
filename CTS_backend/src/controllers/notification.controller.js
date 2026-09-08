const notificationService = require("../services/notification.service");

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await notificationService.getMyNotifications(
      req.user.userId,
    );

    return res.status(200).json({
      success: true,
      message: "Notifications fetched successfully",
      data: notifications,
    });
  } catch (error) {
    console.error("Fetch notifications error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

const getMyUnreadNotifications = async (req, res) => {
  try {
    const notifications = await notificationService.getMyUnreadNotifications(
      req.user.userId,
    );

    return res.status(200).json({
      success: true,
      message: "Unread notifications fetched successfully",
      data: notifications,
    });
  } catch (error) {
    console.error("Fetch unread notifications error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch unread notifications",
    });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    if (!notificationId || !/^\d+$/.test(String(notificationId))) {
      return res.status(400).json({
        success: false,
        message: "Valid notification ID is required",
      });
    }

    const notification = await notificationService.markNotificationAsRead({
      notificationId,
      userId: req.user.userId,
    });

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    console.error("Mark notification read error:", error.message);

    if (error.message === "Notification not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message === "You do not have permission to modify this notification"
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {
    const updatedCount = await notificationService.markAllNotificationsAsRead(
      req.user.userId,
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      data: {
        updatedCount,
      },
    });
  } catch (error) {
    console.error("Mark all notifications read error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
    });
  }
};

module.exports = {
  getMyNotifications,
  getMyUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};

const notificationModel = require("../models/notification.model");

const createNotification = async ({ userId, title, message, type }, client) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!title || !message) {
    throw new Error("Notification title and message are required");
  }

  return notificationModel.createNotification(
    {
      userId,
      title: title.trim(),
      message: message.trim(),
      type: type ? type.trim().toUpperCase() : "SYSTEM",
    },
    client,
  );
};

const getMyNotifications = async (userId) => {
  return notificationModel.findNotificationsByUserId(userId);
};

const getMyUnreadNotifications = async (userId) => {
  return notificationModel.findUnreadNotificationsByUserId(userId);
};

const markNotificationAsRead = async ({ notificationId, userId }) => {
  const notification =
    await notificationModel.findNotificationById(notificationId);

  if (!notification) {
    throw new Error("Notification not found");
  }

  if (String(notification.user_id) !== String(userId)) {
    throw new Error("You do not have permission to modify this notification");
  }

  const updatedNotification =
    await notificationModel.markNotificationAsRead(notificationId);

  return updatedNotification;
};

const markAllNotificationsAsRead = async (userId) => {
  return notificationModel.markAllNotificationsAsRead(userId);
};

const createShipmentStatusNotification = async ({
  userId,
  trackingNumber,
  status,
  client,
}) => {
  const notificationMap = {
    PICKED_UP: {
      title: "Shipment Picked Up",
      message: `Your shipment ${trackingNumber} has been picked up.`,
      type: "SHIPMENT",
    },

    IN_TRANSIT: {
      title: "Shipment In Transit",
      message: `Your shipment ${trackingNumber} is currently in transit.`,
      type: "SHIPMENT",
    },

    DESTINATION_HUB: {
      title: "Shipment Reached Destination Hub",
      message: `Your shipment ${trackingNumber} has reached the destination hub.`,
      type: "SHIPMENT",
    },

    OUT_FOR_DELIVERY: {
      title: "Shipment Out for Delivery",
      message: `Your shipment ${trackingNumber} is out for delivery.`,
      type: "SHIPMENT",
    },

    DELIVERED: {
      title: "Shipment Delivered",
      message: `Your shipment ${trackingNumber} has been delivered successfully.`,
      type: "SHIPMENT",
    },

    DELIVERY_FAILED: {
      title: "Delivery Attempt Failed",
      message: `The delivery attempt for shipment ${trackingNumber} was unsuccessful.`,
      type: "SHIPMENT",
    },

    CANCELLED: {
      title: "Shipment Cancelled",
      message: `Your shipment ${trackingNumber} has been cancelled.`,
      type: "SHIPMENT",
    },
  };

  const notification = notificationMap[status];

  if (!notification) {
    return null;
  }

  return createNotification(
    {
      userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
    },
    client,
  );
};

module.exports = {
  createNotification,
  createShipmentStatusNotification,
  getMyNotifications,
  getMyUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};

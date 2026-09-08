const pool = require("../config/database");

const createNotification = async (
  { userId, title, message, type },
  client = pool,
) => {
  const result = await client.query(
    `
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type
    )
    VALUES ($1, $2, $3, $4)
    RETURNING
      id,
      user_id,
      title,
      message,
      type,
      is_read,
      created_at
    `,
    [userId, title, message, type],
  );

  return result.rows[0];
};

const findNotificationsByUserId = async (userId, client = pool) => {
  const result = await client.query(
    `
    SELECT
      id,
      user_id,
      title,
      message,
      type,
      is_read,
      created_at
    FROM notifications
    WHERE user_id = $1
    ORDER BY created_at DESC, id DESC
    `,
    [userId],
  );

  return result.rows;
};

const findUnreadNotificationsByUserId = async (userId, client = pool) => {
  const result = await client.query(
    `
    SELECT
      id,
      user_id,
      title,
      message,
      type,
      is_read,
      created_at
    FROM notifications
    WHERE user_id = $1
      AND is_read = FALSE
    ORDER BY created_at DESC, id DESC
    `,
    [userId],
  );

  return result.rows;
};

const findNotificationById = async (notificationId, client = pool) => {
  const result = await client.query(
    `
    SELECT
      id,
      user_id,
      title,
      message,
      type,
      is_read,
      created_at
    FROM notifications
    WHERE id = $1
    LIMIT 1
    `,
    [notificationId],
  );

  return result.rows[0] || null;
};

const markNotificationAsRead = async (notificationId, client = pool) => {
  const result = await client.query(
    `
    UPDATE notifications
    SET is_read = TRUE
    WHERE id = $1
    RETURNING
      id,
      user_id,
      title,
      message,
      type,
      is_read,
      created_at
    `,
    [notificationId],
  );

  return result.rows[0] || null;
};

const markAllNotificationsAsRead = async (userId, client = pool) => {
  const result = await client.query(
    `
    UPDATE notifications
    SET is_read = TRUE
    WHERE user_id = $1
      AND is_read = FALSE
    RETURNING id
    `,
    [userId],
  );

  return result.rowCount;
};

module.exports = {
  createNotification,
  findNotificationsByUserId,
  findUnreadNotificationsByUserId,
  findNotificationById,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};

const pool = require("../config/database");

const createSession = async ({ userId, jti, expiresAt }) => {
  const result = await pool.query(
    `
    INSERT INTO auth_sessions (
      user_id,
      jti,
      expires_at
    )
    VALUES ($1, $2, $3)
    RETURNING
      id,
      user_id,
      jti,
      expires_at,
      revoked_at,
      created_at
    `,
    [userId, jti, expiresAt],
  );

  return result.rows[0];
};

const findActiveSessionByJti = async (jti) => {
  const result = await pool.query(
    `
    SELECT
      id,
      user_id,
      jti,
      expires_at,
      revoked_at,
      created_at
    FROM auth_sessions
    WHERE jti = $1
      AND revoked_at IS NULL
      AND expires_at > CURRENT_TIMESTAMP
    LIMIT 1
    `,
    [jti],
  );

  return result.rows[0] || null;
};

const revokeSessionByJti = async (jti) => {
  const result = await pool.query(
    `
    UPDATE auth_sessions
    SET revoked_at = CURRENT_TIMESTAMP
    WHERE jti = $1
      AND revoked_at IS NULL
    RETURNING
      id,
      user_id,
      jti,
      expires_at,
      revoked_at
    `,
    [jti],
  );

  return result.rows[0] || null;
};

module.exports = {
  createSession,
  findActiveSessionByJti,
  revokeSessionByJti,
};

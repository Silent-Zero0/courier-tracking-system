const pool = require("../config/database");

const findUserByEmail = async (email) => {
  const result = await pool.query(
    `
    SELECT
      id,
      name,
      email,
      password_hash,
      phone,
      role_id,
      status,
      created_at,
      updated_at
    FROM users
    WHERE email = $1
    LIMIT 1
    `,
    [email],
  );

  return result.rows[0] || null;
};

const findUserById = async (userId) => {
  const result = await pool.query(
    `
    SELECT
      u.id,
      u.name,
      u.email,
      u.phone,
      u.role_id,
      u.hub_id,
      u.status,
      r.name AS role_name
    FROM users u
    INNER JOIN roles r
      ON u.role_id = r.id
    WHERE u.id = $1
    LIMIT 1
    `,
    [userId],
  );

  return result.rows[0] || null;
};

const findRoleByName = async (name) => {
  const result = await pool.query(
    `
    SELECT
      id,
      name
    FROM roles
    WHERE name = $1
    LIMIT 1
    `,
    [name],
  );

  return result.rows[0] || null;
};

const createUser = async ({ name, email, passwordHash, phone, roleId }) => {
  const result = await pool.query(
    `
    INSERT INTO users (
      name,
      email,
      password_hash,
      phone,
      role_id
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING
      id,
      name,
      email,
      phone,
      role_id,
      status,
      created_at,
      updated_at
    `,
    [name, email, passwordHash, phone, roleId],
  );

  return result.rows[0];
};

module.exports = {
  findUserByEmail,
  findUserById,
  findRoleByName,
  createUser,
};

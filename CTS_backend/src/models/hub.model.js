const pool = require("../config/database");

const createHub = async ({ name, code, city, address }, client = pool) => {
  const result = await client.query(
    `
    INSERT INTO hubs (
      name,
      code,
      city,
      address
    )
    VALUES ($1, $2, $3, $4)
    RETURNING
      id,
      name,
      code,
      city,
      address,
      status,
      created_at,
      updated_at
    `,
    [name, code, city, address],
  );

  return result.rows[0];
};

const findHubById = async (hubId, client = pool) => {
  const result = await client.query(
    `
    SELECT
      id,
      name,
      code,
      city,
      address,
      status,
      created_at,
      updated_at
    FROM hubs
    WHERE id = $1
    LIMIT 1
    `,
    [hubId],
  );

  return result.rows[0] || null;
};

const findHubByCode = async (code, client = pool) => {
  const result = await client.query(
    `
    SELECT
      id,
      name,
      code,
      city,
      address,
      status,
      created_at,
      updated_at
    FROM hubs
    WHERE code = $1
    LIMIT 1
    `,
    [code],
  );

  return result.rows[0] || null;
};

const findAllHubs = async (client = pool) => {
  const result = await client.query(
    `
    SELECT
      id,
      name,
      code,
      city,
      address,
      status,
      created_at,
      updated_at
    FROM hubs
    ORDER BY id ASC
    `,
  );

  return result.rows;
};

const updateHub = async (
  hubId,
  { name, city, address, status },
  client = pool,
) => {
  const result = await client.query(
    `
    UPDATE hubs
    SET
      name = $1,
      city = $2,
      address = $3,
      status = $4,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $5
    RETURNING
      id,
      name,
      code,
      city,
      address,
      status,
      created_at,
      updated_at
    `,
    [name, city, address, status, hubId],
  );

  return result.rows[0] || null;
};

module.exports = {
  createHub,
  findHubById,
  findHubByCode,
  findAllHubs,
  updateHub,
};

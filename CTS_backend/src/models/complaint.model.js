const pool = require("../config/database");

const createComplaint = async (
  { shipmentId, customerId, category, description, priority },
  client = pool,
) => {
  const result = await client.query(
    `
    INSERT INTO complaints (
      shipment_id,
      customer_id,
      category,
      description,
      priority
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING
      id,
      shipment_id,
      customer_id,
      category,
      description,
      priority,
      status,
      created_at,
      updated_at
    `,
    [shipmentId, customerId, category, description, priority],
  );

  return result.rows[0];
};

const findComplaintById = async (complaintId, client = pool) => {
  const result = await client.query(
    `
    SELECT
      id,
      shipment_id,
      customer_id,
      category,
      description,
      priority,
      status,
      created_at,
      updated_at
    FROM complaints
    WHERE id = $1
    LIMIT 1
    `,
    [complaintId],
  );

  return result.rows[0] || null;
};

const findComplaintsByCustomerId = async (
  customerId,
  client = pool,
) => {
  const result = await client.query(
    `
    SELECT
      id,
      shipment_id,
      customer_id,
      category,
      description,
      priority,
      status,
      created_at,
      updated_at
    FROM complaints
    WHERE customer_id = $1
    ORDER BY created_at DESC, id DESC
    `,
    [customerId],
  );

  return result.rows;
};

const findAllComplaints = async (client = pool) => {
  const result = await client.query(
    `
    SELECT
      c.id,
      c.shipment_id,
      c.customer_id,
      c.category,
      c.description,
      c.priority,
      c.status,
      c.created_at,
      c.updated_at,

      s.tracking_number,

      u.name AS customer_name,
      u.email AS customer_email

    FROM complaints c

    INNER JOIN shipments s
      ON c.shipment_id = s.id

    INNER JOIN users u
      ON c.customer_id = u.id

    ORDER BY c.created_at DESC, c.id DESC
    `,
  );

  return result.rows;
};

const updateComplaintStatus = async (
  complaintId,
  status,
  client = pool,
) => {
  const result = await client.query(
    `
    UPDATE complaints
    SET
      status = $1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING
      id,
      shipment_id,
      customer_id,
      category,
      description,
      priority,
      status,
      created_at,
      updated_at
    `,
    [status, complaintId],
  );

  return result.rows[0] || null;
};

module.exports = {
  createComplaint,
  findComplaintById,
  findComplaintsByCustomerId,
  findAllComplaints,
  updateComplaintStatus,
};
const pool = require("../config/database");

const createShipment = async (
  {
    trackingNumber,
    senderId,
    receiverName,
    receiverPhone,
    receiverEmail,
    receiverAddress,
    receiverCity,
    receiverState,
    receiverPostalCode,
    expectedDelivery,
  },
  client = pool,
) => {
  const result = await client.query(
    `
    INSERT INTO shipments (
      tracking_number,
      sender_id,
      receiver_name,
      receiver_phone,
      receiver_email,
      receiver_address,
      receiver_city,
      receiver_state,
      receiver_postal_code,
      expected_delivery
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING
      id,
      tracking_number,
      sender_id,
      receiver_name,
      receiver_phone,
      receiver_email,
      receiver_address,
      receiver_city,
      receiver_state,
      receiver_postal_code,
      origin_hub_id,
      destination_hub_id,
      current_status,
      expected_delivery,
      created_at,
      updated_at
    `,
    [
      trackingNumber,
      senderId,
      receiverName,
      receiverPhone,
      receiverEmail,
      receiverAddress,
      receiverCity,
      receiverState,
      receiverPostalCode,
      expectedDelivery,
    ],
  );

  return result.rows[0];
};

const findShipmentById = async (shipmentId, client = pool) => {
  const result = await client.query(
    `
    SELECT
      id,
      tracking_number,
      sender_id,
      receiver_name,
      receiver_phone,
      receiver_email,
      receiver_address,
      receiver_city,
      receiver_state,
      receiver_postal_code,
      origin_hub_id,
      destination_hub_id,
      current_status,
      expected_delivery,
      created_at,
      updated_at
    FROM shipments
    WHERE id = $1
    LIMIT 1
    `,
    [shipmentId],
  );

  return result.rows[0] || null;
};

const updateShipmentStatus = async (shipmentId, nextStatus, client = pool) => {
  const result = await client.query(
    `
    UPDATE shipments
    SET
      current_status = $1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING
      id,
      tracking_number,
      sender_id,
      current_status,
      updated_at
    `,
    [nextStatus, shipmentId],
  );

  return result.rows[0] || null;
};

const findShipmentByTrackingNumber = async (trackingNumber, client = pool) => {
  const result = await client.query(
    `
    SELECT
      id,
      tracking_number,
      sender_id,
      receiver_name,
      receiver_phone,
      receiver_email,
      receiver_address,
      receiver_city,
      receiver_state,
      receiver_postal_code,
      origin_hub_id,
      destination_hub_id,
      current_status,
      expected_delivery,
      created_at,
      updated_at
    FROM shipments
    WHERE tracking_number = $1
    LIMIT 1
    `,
    [trackingNumber],
  );

  return result.rows[0] || null;
};

const findTrackingEventsByShipmentId = async (shipmentId, client = pool) => {
  const result = await client.query(
    `
    SELECT
      id,
      shipment_id,
      status,
      hub_id,
      description,
      updated_by,
      created_at
    FROM tracking_events
    WHERE shipment_id = $1
    ORDER BY created_at ASC, id ASC
    `,
    [shipmentId],
  );

  return result.rows;
};

const assignHubs = async (
  shipmentId,
  { originHubId, destinationHubId },
  client = pool,
) => {
  const result = await client.query(
    `
    UPDATE shipments
    SET
      origin_hub_id = $1,
      destination_hub_id = $2,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING
      id,
      tracking_number,
      sender_id,
      origin_hub_id,
      destination_hub_id,
      current_status,
      updated_at
    `,
    [originHubId, destinationHubId, shipmentId],
  );

  return result.rows[0] || null;
};

const findShipmentWithHubsById = async (shipmentId, client = pool) => {
  const result = await client.query(
    `
    SELECT
      s.id,
      s.tracking_number,
      s.sender_id,
      s.origin_hub_id,
      oh.name AS origin_hub_name,
      oh.code AS origin_hub_code,
      s.destination_hub_id,
      dh.name AS destination_hub_name,
      dh.code AS destination_hub_code,
      s.current_status,
      s.expected_delivery,
      s.created_at,
      s.updated_at
    FROM shipments s
    LEFT JOIN hubs oh
      ON s.origin_hub_id = oh.id
    LEFT JOIN hubs dh
      ON s.destination_hub_id = dh.id
    WHERE s.id = $1
    LIMIT 1
    `,
    [shipmentId],
  );

  return result.rows[0] || null;
};

const findShipmentsBySenderId = async (senderId, client = pool) => {
  const result = await client.query(
    `
    SELECT
      s.id,
      s.tracking_number,
      s.receiver_name,
      s.receiver_city,
      s.receiver_state,
      s.current_status,
      s.expected_delivery,
      s.created_at,
      s.updated_at,

      oh.name AS origin_hub_name,
      oh.code AS origin_hub_code,

      dh.name AS destination_hub_name,
      dh.code AS destination_hub_code

    FROM shipments s

    LEFT JOIN hubs oh
      ON s.origin_hub_id = oh.id

    LEFT JOIN hubs dh
      ON s.destination_hub_id = dh.id

    WHERE s.sender_id = $1
    ORDER BY s.created_at DESC, s.id DESC
    `,
    [senderId],
  );

  return result.rows;
};

const findCustomerShipmentDetailsById = async (
  shipmentId,
  senderId,
  client = pool,
) => {
  const result = await client.query(
    `
    SELECT
      s.id,
      s.tracking_number,
      s.sender_id,

      s.receiver_name,
      s.receiver_phone,
      s.receiver_email,
      s.receiver_address,
      s.receiver_city,
      s.receiver_state,
      s.receiver_postal_code,

      s.origin_hub_id,
      oh.name AS origin_hub_name,
      oh.code AS origin_hub_code,

      s.destination_hub_id,
      dh.name AS destination_hub_name,
      dh.code AS destination_hub_code,

      s.current_status,
      s.expected_delivery,
      s.created_at,
      s.updated_at

    FROM shipments s

    LEFT JOIN hubs oh
      ON s.origin_hub_id = oh.id

    LEFT JOIN hubs dh
      ON s.destination_hub_id = dh.id

    WHERE s.id = $1
      AND s.sender_id = $2
    LIMIT 1
    `,
    [shipmentId, senderId],
  );

  return result.rows[0] || null;
};

const findAllShipments = async (
  { limit, offset, status, search },
  client = pool,
) => {
  const values = [limit, offset];
  const conditions = [];

  if (status) {
    values.push(status);
    conditions.push(`s.current_status = $${values.length}`);
  }

  if (search) {
    values.push(`%${search}%`);
    conditions.push(`s.tracking_number ILIKE $${values.length}`);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await client.query(
    `
    SELECT
      s.id,
      s.tracking_number,
      s.sender_id,

      s.receiver_name,
      s.receiver_city,
      s.receiver_state,
      s.receiver_postal_code,

      s.origin_hub_id,
      oh.name AS origin_hub_name,
      oh.code AS origin_hub_code,

      s.destination_hub_id,
      dh.name AS destination_hub_name,
      dh.code AS destination_hub_code,

      s.current_status,
      s.expected_delivery,
      s.created_at,
      s.updated_at

    FROM shipments s

    LEFT JOIN hubs oh
      ON s.origin_hub_id = oh.id

    LEFT JOIN hubs dh
      ON s.destination_hub_id = dh.id

    ${whereClause}

    ORDER BY s.created_at DESC, s.id DESC

    LIMIT $1
    OFFSET $2
    `,
    values,
  );

  const countValues = [];
  const countConditions = [];

  if (status) {
    countValues.push(status);
    countConditions.push(`current_status = $${countValues.length}`);
  }

  if (search) {
    countValues.push(`%${search}%`);
    countConditions.push(`tracking_number ILIKE $${countValues.length}`);
  }

  const countWhereClause =
    countConditions.length > 0 ? `WHERE ${countConditions.join(" AND ")}` : "";

  const countResult = await client.query(
    `
    SELECT COUNT(*)::int AS total
    FROM shipments
    ${countWhereClause}
    `,
    countValues,
  );

  return {
    shipments: result.rows,
    total: countResult.rows[0].total,
  };
};

const findAdminShipmentDetailsById = async (shipmentId, client = pool) => {
  const result = await client.query(
    `
    SELECT
      s.id,
      s.tracking_number,

      s.sender_id,
      u.name AS sender_name,
      u.email AS sender_email,
      u.phone AS sender_phone,

      s.receiver_name,
      s.receiver_phone,
      s.receiver_email,
      s.receiver_address,
      s.receiver_city,
      s.receiver_state,
      s.receiver_postal_code,

      s.origin_hub_id,
      oh.name AS origin_hub_name,
      oh.code AS origin_hub_code,

      s.destination_hub_id,
      dh.name AS destination_hub_name,
      dh.code AS destination_hub_code,

      s.current_status,
      s.expected_delivery,
      s.created_at,
      s.updated_at

    FROM shipments s

    INNER JOIN users u
      ON s.sender_id = u.id

    LEFT JOIN hubs oh
      ON s.origin_hub_id = oh.id

    LEFT JOIN hubs dh
      ON s.destination_hub_id = dh.id

    WHERE s.id = $1
    LIMIT 1
    `,
    [shipmentId],
  );

  return result.rows[0] || null;
};

const findShipmentsByHubId = async (hubId, client = pool) => {
  const result = await client.query(
    `
    SELECT
      s.id,
      s.tracking_number,
      s.sender_id,

      s.receiver_name,
      s.receiver_phone,
      s.receiver_city,
      s.receiver_state,
      s.receiver_postal_code,

      s.origin_hub_id,
      oh.name AS origin_hub_name,
      oh.code AS origin_hub_code,

      s.destination_hub_id,
      dh.name AS destination_hub_name,
      dh.code AS destination_hub_code,

      s.current_status,
      s.expected_delivery,
      s.created_at,
      s.updated_at

    FROM shipments s

    LEFT JOIN hubs oh
      ON s.origin_hub_id = oh.id

    LEFT JOIN hubs dh
      ON s.destination_hub_id = dh.id

    WHERE s.origin_hub_id = $1
       OR s.destination_hub_id = $1

    ORDER BY s.updated_at DESC, s.id DESC
    `,
    [hubId],
  );

  return result.rows;
};

module.exports = {
  createShipment,
  findShipmentById,
  updateShipmentStatus,
  findShipmentByTrackingNumber,
  findTrackingEventsByShipmentId,
  assignHubs,
  findShipmentWithHubsById,
  findShipmentsBySenderId,
  findCustomerShipmentDetailsById,
  findAllShipments,
  findAdminShipmentDetailsById,
  findShipmentsByHubId,
};

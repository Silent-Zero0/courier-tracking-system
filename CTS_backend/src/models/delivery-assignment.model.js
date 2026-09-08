const pool = require("../config/database");

const createDeliveryAssignment = async (
  { shipmentId, agentId, assignedBy },
  client = pool,
) => {
  const result = await client.query(
    `
    INSERT INTO delivery_assignments (
      shipment_id,
      agent_id,
      assigned_by
    )
    VALUES ($1, $2, $3)
    RETURNING
      id,
      shipment_id,
      agent_id,
      assigned_by,
      assigned_at,
      status
    `,
    [shipmentId, agentId, assignedBy],
  );

  return result.rows[0];
};

const findActiveAssignmentByShipmentId = async (shipmentId, client = pool) => {
  const result = await client.query(
    `
    SELECT
      id,
      shipment_id,
      agent_id,
      assigned_by,
      assigned_at,
      status
    FROM delivery_assignments
    WHERE shipment_id = $1
      AND status IN ('ASSIGNED', 'IN_PROGRESS')
    ORDER BY assigned_at DESC, id DESC
    LIMIT 1
    `,
    [shipmentId],
  );

  return result.rows[0] || null;
};

const findAssignmentById = async (assignmentId, client = pool) => {
  const result = await client.query(
    `
    SELECT
      id,
      shipment_id,
      agent_id,
      assigned_by,
      assigned_at,
      status
    FROM delivery_assignments
    WHERE id = $1
    LIMIT 1
    `,
    [assignmentId],
  );

  return result.rows[0] || null;
};

const findAssignmentsByAgentId = async (agentId, client = pool) => {
  const result = await client.query(
    `
    SELECT
      id,
      shipment_id,
      agent_id,
      assigned_by,
      assigned_at,
      status
    FROM delivery_assignments
    WHERE agent_id = $1
    ORDER BY assigned_at DESC, id DESC
    `,
    [agentId],
  );

  return result.rows;
};

const findActiveAssignmentByShipmentAndAgent = async (
  shipmentId,
  agentId,
  client = pool,
) => {
  const result = await client.query(
    `
    SELECT
      id,
      shipment_id,
      agent_id,
      assigned_by,
      assigned_at,
      status
    FROM delivery_assignments
    WHERE shipment_id = $1
      AND agent_id = $2
      AND status IN ('ASSIGNED', 'IN_PROGRESS')
    ORDER BY assigned_at DESC, id DESC
    LIMIT 1
    `,
    [shipmentId, agentId],
  );

  return result.rows[0] || null;
};

const findLatestAssignmentDetailsByShipmentId = async (
  shipmentId,
  client = pool,
) => {
  const result = await client.query(
    `
    SELECT
      da.id,
      da.shipment_id,
      da.agent_id,
      da.assigned_by,
      da.assigned_at,
      da.status,

      agent.name AS agent_name,
      agent.email AS agent_email,
      agent.phone AS agent_phone,

      assigner.name AS assigned_by_name

    FROM delivery_assignments da

    INNER JOIN users agent
      ON da.agent_id = agent.id

    LEFT JOIN users assigner
      ON da.assigned_by = assigner.id

    WHERE da.shipment_id = $1

    ORDER BY da.assigned_at DESC, da.id DESC
    LIMIT 1
    `,
    [shipmentId],
  );

  return result.rows[0] || null;
};

const updateAssignmentStatus = async (assignmentId, status, client = pool) => {
  const result = await client.query(
    `
    UPDATE delivery_assignments
    SET
      status = $1
    WHERE id = $2
    RETURNING
      id,
      shipment_id,
      agent_id,
      assigned_by,
      assigned_at,
      status
    `,
    [status, assignmentId],
  );

  return result.rows[0] || null;
};

const updateActiveAssignmentStatusByShipmentId = async (
  shipmentId,
  status,
  client = pool,
) => {
  const result = await client.query(
    `
    UPDATE delivery_assignments
    SET status = $1
    WHERE shipment_id = $2
      AND status IN ('ASSIGNED', 'IN_PROGRESS')
    RETURNING
      id,
      shipment_id,
      agent_id,
      assigned_by,
      assigned_at,
      status
    `,
    [status, shipmentId],
  );

  return result.rows[0] || null;
};

const findAssignmentDetailsById = async (assignmentId, client = pool) => {
  const result = await client.query(
    `
    SELECT
      da.id,
      da.shipment_id,
      da.agent_id,
      da.assigned_by,
      da.assigned_at,
      da.status,

      s.tracking_number,
      s.current_status,
      s.receiver_name,
      s.receiver_phone,
      s.receiver_email,
      s.receiver_address,
      s.receiver_city,
      s.receiver_state,
      s.receiver_postal_code,
      s.expected_delivery,

      oh.id AS origin_hub_id,
      oh.name AS origin_hub_name,
      oh.code AS origin_hub_code,

      dh.id AS destination_hub_id,
      dh.name AS destination_hub_name,
      dh.code AS destination_hub_code

    FROM delivery_assignments da

    INNER JOIN shipments s
      ON da.shipment_id = s.id

    LEFT JOIN hubs oh
      ON s.origin_hub_id = oh.id

    LEFT JOIN hubs dh
      ON s.destination_hub_id = dh.id

    WHERE da.id = $1
    LIMIT 1
    `,
    [assignmentId],
  );

  return result.rows[0] || null;
};

module.exports = {
  createDeliveryAssignment,
  findActiveAssignmentByShipmentId,
  findAssignmentById,
  findAssignmentsByAgentId,
  findActiveAssignmentByShipmentAndAgent,
  updateAssignmentStatus,
  updateActiveAssignmentStatusByShipmentId,
  findAssignmentDetailsById,
  findLatestAssignmentDetailsByShipmentId,
};

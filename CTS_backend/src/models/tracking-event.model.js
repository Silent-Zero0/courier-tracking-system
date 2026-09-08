const pool = require("../config/database");

const createTrackingEvent = async (
  { shipmentId, status, hubId, description, updatedBy },
  client = pool,
) => {
  const result = await client.query(
    `
    INSERT INTO tracking_events (
      shipment_id,
      status,
      hub_id,
      description,
      updated_by
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING
      id,
      shipment_id,
      status,
      hub_id,
      description,
      updated_by,
      created_at
    `,
    [shipmentId, status, hubId, description, updatedBy],
  );

  return result.rows[0];
};

module.exports = {
  createTrackingEvent,
};

const pool = require("../config/database");

const hubModel = require("../models/hub.model");
const shipmentModel = require("../models/shipment.model");

const createHub = async ({ name, code, city, address }) => {
  const existingHub = await hubModel.findHubByCode(code);

  if (existingHub) {
    throw new Error("Hub with this code already exists");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const hub = await hubModel.createHub(
      {
        name,
        code,
        city,
        address,
      },
      client,
    );

    await client.query("COMMIT");

    return hub;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getHubById = async (hubId) => {
  const hub = await hubModel.findHubById(hubId);

  if (!hub) {
    throw new Error("Hub not found");
  }

  return hub;
};

const getAllHubs = async () => {
  return hubModel.findAllHubs();
};

const updateHub = async (hubId, { name, city, address, status }) => {
  const existingHub = await hubModel.findHubById(hubId);

  if (!existingHub) {
    throw new Error("Hub not found");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const updatedHub = await hubModel.updateHub(
      hubId,
      {
        name,
        city,
        address,
        status,
      },
      client,
    );

    await client.query("COMMIT");

    return updatedHub;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const assignShipmentHubs = async (
  shipmentId,
  { originHubId, destinationHubId },
) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Check whether shipment exists
    const shipment = await shipmentModel.findShipmentById(shipmentId, client);

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    // 2. Check whether origin hub exists
    const originHub = await hubModel.findHubById(originHubId, client);

    if (!originHub) {
      throw new Error("Origin hub not found");
    }

    // 3. Check whether destination hub exists
    const destinationHub = await hubModel.findHubById(destinationHubId, client);

    if (!destinationHub) {
      throw new Error("Destination hub not found");
    }

    // 4. Origin hub must be active
    if (originHub.status !== "ACTIVE") {
      throw new Error("Origin hub is not active");
    }

    // 5. Destination hub must be active
    if (destinationHub.status !== "ACTIVE") {
      throw new Error("Destination hub is not active");
    }

    // 6. Origin and destination must be different
    if (String(originHubId) === String(destinationHubId)) {
      throw new Error("Origin and destination hubs must be different");
    }

    // 7. Assign hubs to shipment
    const updatedShipment = await shipmentModel.assignHubs(
      shipmentId,
      {
        originHubId,
        destinationHubId,
      },
      client,
    );

    // 8. Commit transaction
    await client.query("COMMIT");

    return updatedShipment;
  } catch (error) {
    // Undo all changes if anything fails
    await client.query("ROLLBACK");
    throw error;
  } finally {
    // Release database connection
    client.release();
  }
};

module.exports = {
  createHub,
  getHubById,
  getAllHubs,
  updateHub,
  assignShipmentHubs,
};

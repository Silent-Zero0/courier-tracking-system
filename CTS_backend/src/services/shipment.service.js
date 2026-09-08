const crypto = require("crypto");

const pool = require("../config/database");

const shipmentModel = require("../models/shipment.model");
const trackingEventModel = require("../models/tracking-event.model");
const deliveryAssignmentModel = require("../models/delivery-assignment.model");
const userModel = require("../models/user.model");
const notificationService = require("./notification.service");

const { isValidTransition } = require("../utils/shipment-status");

const generateTrackingNumber = () => {
  const randomPart = crypto.randomBytes(6).toString("hex").toUpperCase();

  return `CTS${Date.now()}${randomPart}`;
};

const createShipment = async ({
  senderId,
  receiverName,
  receiverPhone,
  receiverEmail,
  receiverAddress,
  receiverCity,
  receiverState,
  receiverPostalCode,
  expectedDelivery,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const trackingNumber = generateTrackingNumber();

    const shipment = await shipmentModel.createShipment(
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
      client,
    );

    const trackingEvent = await trackingEventModel.createTrackingEvent(
      {
        shipmentId: shipment.id,
        status: "BOOKED",
        hubId: null,
        description: "Shipment booked successfully",
        updatedBy: senderId,
      },
      client,
    );

    await client.query("COMMIT");

    return {
      shipment,
      trackingEvent,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getShipmentTracking = async (trackingNumber) => {
  const shipment =
    await shipmentModel.findShipmentByTrackingNumber(trackingNumber);

  if (!shipment) {
    throw new Error("Shipment not found");
  }

  const shipmentWithHubs = await shipmentModel.findShipmentWithHubsById(
    shipment.id,
  );

  const trackingEvents = await shipmentModel.findTrackingEventsByShipmentId(
    shipment.id,
  );

  return {
    shipment: {
      id: shipmentWithHubs.id,
      trackingNumber: shipmentWithHubs.tracking_number,

      receiver: {
        name: shipment.receiver_name,
        city: shipment.receiver_city,
        state: shipment.receiver_state,
        postalCode: shipment.receiver_postal_code,
      },

      route: {
        originHub: shipmentWithHubs.origin_hub_id
          ? {
              id: shipmentWithHubs.origin_hub_id,
              name: shipmentWithHubs.origin_hub_name,
              code: shipmentWithHubs.origin_hub_code,
            }
          : null,

        destinationHub: shipmentWithHubs.destination_hub_id
          ? {
              id: shipmentWithHubs.destination_hub_id,
              name: shipmentWithHubs.destination_hub_name,
              code: shipmentWithHubs.destination_hub_code,
            }
          : null,
      },

      currentStatus: shipmentWithHubs.current_status,
      expectedDelivery: shipmentWithHubs.expected_delivery,
      createdAt: shipmentWithHubs.created_at,
      updatedAt: shipmentWithHubs.updated_at,
    },

    trackingEvents: trackingEvents.map((event) => ({
      id: event.id,
      status: event.status,
      hubId: event.hub_id,
      description: event.description,
      createdAt: event.created_at,
    })),
  };
};

const updateShipmentStatus = async ({
  shipmentId,
  nextStatus,
  hubId,
  description,
  actorId,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const shipment = await shipmentModel.findShipmentById(shipmentId, client);

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    const actor = await userModel.findUserById(actorId);

    if (!actor) {
      throw new Error("Actor not found");
    }

    let effectiveHubId = null;

    // Hub staff authorization
    if (actor.role_name === "HUB_STAFF") {
      if (!actor.hub_id) {
        throw new Error("Hub staff is not assigned to a hub");
      }

      const hubStaffStatusRules = {
        PICKED_UP: "origin_hub_id",
        ORIGIN_HUB: "origin_hub_id",
        IN_TRANSIT: "origin_hub_id",
        DESTINATION_HUB: "destination_hub_id",
      };

      if (
        !Object.prototype.hasOwnProperty.call(hubStaffStatusRules, nextStatus)
      ) {
        throw new Error("Hub staff cannot perform this status update");
      }

      const requiredHubField = hubStaffStatusRules[nextStatus];

      if (String(shipment[requiredHubField]) !== String(actor.hub_id)) {
        throw new Error("Hub staff is not authorized for this shipment");
      }

      // Never trust hubId sent by the client
      effectiveHubId = actor.hub_id;
    }

    // Delivery agent authorization
    if (actor.role_name === "DELIVERY_AGENT") {
      const assignment =
        await deliveryAssignmentModel.findActiveAssignmentByShipmentAndAgent(
          shipmentId,
          actorId,
          client,
        );

      if (!assignment) {
        throw new Error("Delivery agent is not assigned to this shipment");
      }

      const allowedAgentStatuses = [
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "DELIVERY_FAILED",
      ];

      if (!allowedAgentStatuses.includes(nextStatus)) {
        throw new Error("Delivery agent cannot perform this status update");
      }

      // Delivery agents are not allowed to choose a hub
      effectiveHubId = null;
    }

    // Admin can optionally provide a hub ID
    if (actor.role_name === "ADMIN") {
      effectiveHubId = hubId || null;
    }

    if (!isValidTransition(shipment.current_status, nextStatus)) {
      throw new Error(
        `Invalid status transition: ${shipment.current_status} -> ${nextStatus}`,
      );
    }

    const updatedShipment = await shipmentModel.updateShipmentStatus(
      shipmentId,
      nextStatus,
      client,
    );

    let updatedAssignment = null;

    const assignmentStatusMap = {
      OUT_FOR_DELIVERY: "IN_PROGRESS",
      DELIVERED: "COMPLETED",
      DELIVERY_FAILED: "FAILED",
    };

    if (assignmentStatusMap[nextStatus]) {
      updatedAssignment =
        await deliveryAssignmentModel.updateActiveAssignmentStatusByShipmentId(
          shipmentId,
          assignmentStatusMap[nextStatus],
          client,
        );
    }

    const trackingEvent = await trackingEventModel.createTrackingEvent(
      {
        shipmentId,
        status: nextStatus,
        hubId: effectiveHubId,
        description: description || null,
        updatedBy: actorId,
      },
      client,
    );

    await notificationService.createShipmentStatusNotification({
      userId: shipment.sender_id,
      trackingNumber: shipment.tracking_number,
      status: nextStatus,
      client,
    });

    await client.query("COMMIT");

    return {
      shipment: updatedShipment,
      trackingEvent,
      assignment: updatedAssignment,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const cancelShipment = async ({ shipmentId, customerId }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const shipment = await shipmentModel.findShipmentById(shipmentId, client);

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    if (String(shipment.sender_id) !== String(customerId)) {
      throw new Error("You can only cancel your own shipment");
    }

    if (shipment.current_status !== "BOOKED") {
      throw new Error(
        `Shipment cannot be cancelled from status: ${shipment.current_status}`,
      );
    }

    const updatedShipment = await shipmentModel.updateShipmentStatus(
      shipmentId,
      "CANCELLED",
      client,
    );

    const trackingEvent = await trackingEventModel.createTrackingEvent(
      {
        shipmentId,
        status: "CANCELLED",
        hubId: null,
        description: "Shipment cancelled by customer",
        updatedBy: customerId,
      },
      client,
    );

    await notificationService.createShipmentStatusNotification({
      userId: shipment.sender_id,
      trackingNumber: shipment.tracking_number,
      status: "CANCELLED",
      client,
    });

    await client.query("COMMIT");

    return {
      shipment: updatedShipment,
      trackingEvent,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getMyShipments = async (senderId) => {
  const shipments = await shipmentModel.findShipmentsBySenderId(senderId);

  return shipments;
};

const getAllShipments = async ({ page, limit, status, search }) => {
  const offset = (page - 1) * limit;

  const result = await shipmentModel.findAllShipments({
    limit,
    offset,
    status,
    search,
  });

  const totalPages = Math.ceil(result.total / limit);

  return {
    shipments: result.shipments.map((shipment) => ({
      id: shipment.id,
      trackingNumber: shipment.tracking_number,
      senderId: shipment.sender_id,

      receiver: {
        name: shipment.receiver_name,
        city: shipment.receiver_city,
        state: shipment.receiver_state,
        postalCode: shipment.receiver_postal_code,
      },

      route: {
        originHub: shipment.origin_hub_id
          ? {
              id: shipment.origin_hub_id,
              name: shipment.origin_hub_name,
              code: shipment.origin_hub_code,
            }
          : null,

        destinationHub: shipment.destination_hub_id
          ? {
              id: shipment.destination_hub_id,
              name: shipment.destination_hub_name,
              code: shipment.destination_hub_code,
            }
          : null,
      },

      currentStatus: shipment.current_status,
      expectedDelivery: shipment.expected_delivery,
      createdAt: shipment.created_at,
      updatedAt: shipment.updated_at,
    })),

    pagination: {
      page,
      limit,
      total: result.total,
      totalPages,
    },

    filters: {
      status: status || null,
      search: search || null,
    },
  };
};

const getAdminShipmentDetails = async (shipmentId) => {
  const shipment = await shipmentModel.findAdminShipmentDetailsById(shipmentId);

  if (!shipment) {
    throw new Error("Shipment not found");
  }

  const trackingEvents = await shipmentModel.findTrackingEventsByShipmentId(
    shipment.id,
  );

  const assignment =
    await deliveryAssignmentModel.findLatestAssignmentDetailsByShipmentId(
      shipment.id,
    );

  return {
    shipment: {
      id: shipment.id,
      trackingNumber: shipment.tracking_number,

      sender: {
        id: shipment.sender_id,
        name: shipment.sender_name,
        email: shipment.sender_email,
        phone: shipment.sender_phone,
      },

      receiver: {
        name: shipment.receiver_name,
        phone: shipment.receiver_phone,
        email: shipment.receiver_email,
        address: shipment.receiver_address,
        city: shipment.receiver_city,
        state: shipment.receiver_state,
        postalCode: shipment.receiver_postal_code,
      },

      route: {
        originHub: shipment.origin_hub_id
          ? {
              id: shipment.origin_hub_id,
              name: shipment.origin_hub_name,
              code: shipment.origin_hub_code,
            }
          : null,

        destinationHub: shipment.destination_hub_id
          ? {
              id: shipment.destination_hub_id,
              name: shipment.destination_hub_name,
              code: shipment.destination_hub_code,
            }
          : null,
      },

      currentStatus: shipment.current_status,
      expectedDelivery: shipment.expected_delivery,
      createdAt: shipment.created_at,
      updatedAt: shipment.updated_at,
    },

    assignment: assignment
      ? {
          id: assignment.id,
          agent: {
            id: assignment.agent_id,
            name: assignment.agent_name,
            email: assignment.agent_email,
            phone: assignment.agent_phone,
          },
          assignedBy: {
            id: assignment.assigned_by,
            name: assignment.assigned_by_name,
          },
          assignedAt: assignment.assigned_at,
          status: assignment.status,
        }
      : null,

    trackingEvents: trackingEvents.map((event) => ({
      id: event.id,
      status: event.status,
      hubId: event.hub_id,
      description: event.description,
      updatedBy: event.updated_by,
      createdAt: event.created_at,
    })),
  };
};

const getShipmentsByHubId = async ({ hubId, actorId, actorRole }) => {
  if (actorRole === "HUB_STAFF") {
    const user = await userModel.findUserById(actorId);

    if (!user) {
      throw new Error("User not found");
    }

    if (!user.hub_id) {
      throw new Error("Hub staff is not assigned to a hub");
    }

    if (String(user.hub_id) !== String(hubId)) {
      throw new Error("You do not have permission to access this hub");
    }
  }

  const shipments = await shipmentModel.findShipmentsByHubId(hubId);

  return shipments.map((shipment) => ({
    id: shipment.id,
    trackingNumber: shipment.tracking_number,
    senderId: shipment.sender_id,

    receiver: {
      name: shipment.receiver_name,
      phone: shipment.receiver_phone,
      city: shipment.receiver_city,
      state: shipment.receiver_state,
      postalCode: shipment.receiver_postal_code,
    },

    route: {
      originHub: shipment.origin_hub_id
        ? {
            id: shipment.origin_hub_id,
            name: shipment.origin_hub_name,
            code: shipment.origin_hub_code,
          }
        : null,

      destinationHub: shipment.destination_hub_id
        ? {
            id: shipment.destination_hub_id,
            name: shipment.destination_hub_name,
            code: shipment.destination_hub_code,
          }
        : null,
    },

    currentStatus: shipment.current_status,
    expectedDelivery: shipment.expected_delivery,
    createdAt: shipment.created_at,
    updatedAt: shipment.updated_at,
  }));
};

const getMyShipmentDetails = async ({ shipmentId, senderId }) => {
  const shipment = await shipmentModel.findCustomerShipmentDetailsById(
    shipmentId,
    senderId,
  );

  if (!shipment) {
    throw new Error("Shipment not found");
  }

  const trackingEvents = await shipmentModel.findTrackingEventsByShipmentId(
    shipment.id,
  );

  return {
    shipment: {
      id: shipment.id,
      trackingNumber: shipment.tracking_number,

      receiver: {
        name: shipment.receiver_name,
        phone: shipment.receiver_phone,
        email: shipment.receiver_email,
        address: shipment.receiver_address,
        city: shipment.receiver_city,
        state: shipment.receiver_state,
        postalCode: shipment.receiver_postal_code,
      },

      route: {
        originHub: shipment.origin_hub_id
          ? {
              id: shipment.origin_hub_id,
              name: shipment.origin_hub_name,
              code: shipment.origin_hub_code,
            }
          : null,

        destinationHub: shipment.destination_hub_id
          ? {
              id: shipment.destination_hub_id,
              name: shipment.destination_hub_name,
              code: shipment.destination_hub_code,
            }
          : null,
      },

      currentStatus: shipment.current_status,
      expectedDelivery: shipment.expected_delivery,
      createdAt: shipment.created_at,
      updatedAt: shipment.updated_at,
    },

    trackingEvents: trackingEvents.map((event) => ({
      id: event.id,
      status: event.status,
      hubId: event.hub_id,
      description: event.description,
      createdAt: event.created_at,
    })),
  };
};

module.exports = {
  createShipment,
  getShipmentTracking,
  updateShipmentStatus,
  cancelShipment,
  getMyShipments,
  getMyShipmentDetails,
  getAllShipments,
  getAdminShipmentDetails,
};

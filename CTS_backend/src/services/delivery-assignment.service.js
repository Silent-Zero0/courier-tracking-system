const pool = require("../config/database");

const shipmentModel = require("../models/shipment.model");
const userModel = require("../models/user.model");
const deliveryAssignmentModel = require("../models/delivery-assignment.model");
const {
  isValidAssignmentTransition,
} = require("../utils/delivery-assignment-status");

const assignDeliveryAgent = async ({ shipmentId, agentId, assignedBy }) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Check whether shipment exists
    const shipment = await shipmentModel.findShipmentById(shipmentId, client);

    if (!shipment) {
      throw new Error("Shipment not found");
    }

    // 2. Check whether assigned user exists
    const agent = await userModel.findUserById(agentId);

    if (!agent) {
      throw new Error("Delivery agent not found");
    }

    // 3. User must be a DELIVERY_AGENT
    if (agent.role_name !== "DELIVERY_AGENT") {
      throw new Error("Selected user is not a delivery agent");
    }

    // 4. Delivery agent must be active
    if (agent.status !== "ACTIVE") {
      throw new Error("Delivery agent is not active");
    }

    // 5. Check existing active assignment
    const existingAssignment =
      await deliveryAssignmentModel.findActiveAssignmentByShipmentId(
        shipmentId,
        client,
      );

    if (existingAssignment) {
      throw new Error("Shipment already has an active delivery assignment");
    }

    // 6. Create assignment
    const assignment = await deliveryAssignmentModel.createDeliveryAssignment(
      {
        shipmentId,
        agentId,
        assignedBy,
      },
      client,
    );

    await client.query("COMMIT");

    return assignment;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const updateAssignmentStatus = async ({
  assignmentId,
  nextStatus,
  actorId,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const assignment = await deliveryAssignmentModel.findAssignmentById(
      assignmentId,
      client,
    );

    if (!assignment) {
      throw new Error("Delivery assignment not found");
    }

    const actor = await userModel.findUserById(actorId);

    if (!actor) {
      throw new Error("Actor not found");
    }

    // Only the assigned delivery agent can update
    // the assignment status.
    if (
      actor.role_name === "DELIVERY_AGENT" &&
      String(assignment.agent_id) !== String(actorId)
    ) {
      throw new Error("You are not assigned to this delivery");
    }

    // Only ADMIN and the assigned DELIVERY_AGENT
    // can update assignment status.
    if (actor.role_name !== "ADMIN" && actor.role_name !== "DELIVERY_AGENT") {
      throw new Error("You do not have permission to update this assignment");
    }

    if (!isValidAssignmentTransition(assignment.status, nextStatus)) {
      throw new Error(
        `Invalid assignment status transition: ${assignment.status} -> ${nextStatus}`,
      );
    }

    const updatedAssignment =
      await deliveryAssignmentModel.updateAssignmentStatus(
        assignmentId,
        nextStatus,
        client,
      );

    await client.query("COMMIT");

    return updatedAssignment;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const getAssignmentsByAgentId = async (agentId) => {
  const assignments =
    await deliveryAssignmentModel.findAssignmentsByAgentId(agentId);

  return assignments;
};

const getAssignmentDetails = async ({ assignmentId, actorId, actorRole }) => {
  const assignment =
    await deliveryAssignmentModel.findAssignmentDetailsById(assignmentId);

  if (!assignment) {
    throw new Error("Delivery assignment not found");
  }

  // Delivery agent can only view their own assignment
  if (
    actorRole === "DELIVERY_AGENT" &&
    String(assignment.agent_id) !== String(actorId)
  ) {
    throw new Error("You are not assigned to this delivery");
  }

  // Admin can view any assignment
  if (actorRole !== "ADMIN" && actorRole !== "DELIVERY_AGENT") {
    throw new Error("You do not have permission to view this assignment");
  }

  return assignment;
};

module.exports = {
  assignDeliveryAgent,
  updateAssignmentStatus,
  getAssignmentsByAgentId,
  getAssignmentDetails,
};

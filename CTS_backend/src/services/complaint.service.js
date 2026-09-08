const pool = require("../config/database");

const complaintModel = require("../models/complaint.model");
const shipmentModel = require("../models/shipment.model");

const createComplaint = async ({
  shipmentId,
  customerId,
  category,
  description,
  priority = "MEDIUM",
}) => {
  const shipment = await shipmentModel.findShipmentById(shipmentId);

  if (!shipment) {
    throw new Error("Shipment not found");
  }

  // Customer can only create a complaint for their own shipment
  if (String(shipment.sender_id) !== String(customerId)) {
    throw new Error("You can only complain about your own shipment");
  }

  const existingComplaints =
    await complaintModel.findComplaintsByCustomerId(customerId);

  const hasOpenComplaint = existingComplaints.some(
    (complaint) =>
      String(complaint.shipment_id) === String(shipmentId) &&
      ["OPEN", "UNDER_REVIEW"].includes(complaint.status),
  );

  if (hasOpenComplaint) {
    throw new Error("An active complaint already exists for this shipment");
  }

  return complaintModel.createComplaint({
    shipmentId,
    customerId,
    category,
    description,
    priority,
  });
};

const getComplaintById = async ({
  complaintId,
  actorId,
  actorRole,
}) => {
  const complaint = await complaintModel.findComplaintById(complaintId);

  if (!complaint) {
    throw new Error("Complaint not found");
  }

  // Customer can only view their own complaint
  if (
    actorRole === "CUSTOMER" &&
    String(complaint.customer_id) !== String(actorId)
  ) {
    throw new Error("You do not have permission to view this complaint");
  }

  // Only ADMIN and CUSTOMER are allowed here.
  if (actorRole !== "ADMIN" && actorRole !== "CUSTOMER") {
    throw new Error("You do not have permission to view this complaint");
  }

  return complaint;
};

const getMyComplaints = async (customerId) => {
  return complaintModel.findComplaintsByCustomerId(customerId);
};

const getAllComplaints = async () => {
  return complaintModel.findAllComplaints();
};

const updateComplaintStatus = async ({
  complaintId,
  nextStatus,
}) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const complaint = await complaintModel.findComplaintById(
      complaintId,
      client,
    );

    if (!complaint) {
      throw new Error("Complaint not found");
    }

    const allowedTransitions = {
      OPEN: ["UNDER_REVIEW"],
      UNDER_REVIEW: ["RESOLVED"],
      RESOLVED: [],
    };

    if (
      !allowedTransitions[complaint.status]?.includes(nextStatus)
    ) {
      throw new Error(
        `Invalid complaint status transition: ${complaint.status} -> ${nextStatus}`,
      );
    }

    const updatedComplaint =
      await complaintModel.updateComplaintStatus(
        complaintId,
        nextStatus,
        client,
      );

    await client.query("COMMIT");

    return updatedComplaint;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  createComplaint,
  getComplaintById,
  getMyComplaints,
  getAllComplaints,
  updateComplaintStatus,
};
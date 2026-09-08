const deliveryAssignmentService = require("../services/delivery-assignment.service");

const {
  validateAssignDeliveryAgentInput,
} = require("../validators/delivery-assignment.validator");

const assignDeliveryAgent = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { agentId } = req.body;

    // Validate shipment ID from URL
    if (!shipmentId || !/^\d+$/.test(String(shipmentId))) {
      return res.status(400).json({
        success: false,
        message: "Valid shipment ID is required",
      });
    }

    // Validate request body
    const validation = validateAssignDeliveryAgentInput({
      shipmentId,
      agentId,
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    // assignedBy comes from authenticated user
    const assignment = await deliveryAssignmentService.assignDeliveryAgent({
      shipmentId,
      agentId,
      assignedBy: req.user.userId,
    });

    return res.status(201).json({
      success: true,
      message: "Delivery agent assigned successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("Delivery agent assignment error:", error.message);

    if (error.message === "Shipment not found") {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    if (error.message === "Delivery agent not found") {
      return res.status(404).json({
        success: false,
        message: "Delivery agent not found",
      });
    }

    if (error.message === "Selected user is not a delivery agent") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Delivery agent is not active") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message === "Shipment already has an active delivery assignment"
    ) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Delivery agent assignment failed",
    });
  }
};

const updateAssignmentStatus = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { nextStatus } = req.body;

    if (!assignmentId || !/^\d+$/.test(String(assignmentId))) {
      return res.status(400).json({
        success: false,
        message: "Valid assignment ID is required",
      });
    }

    if (!nextStatus || typeof nextStatus !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid next status is required",
      });
    }

    const updatedAssignment =
      await deliveryAssignmentService.updateAssignmentStatus({
        assignmentId,
        nextStatus: nextStatus.trim().toUpperCase(),
        actorId: req.user.userId,
      });

    return res.status(200).json({
      success: true,
      message: "Delivery assignment status updated successfully",
      data: updatedAssignment,
    });
  } catch (error) {
    console.error("Delivery assignment status update error:", error.message);

    if (error.message === "Delivery assignment not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Actor not found") {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found",
      });
    }

    if (error.message === "You are not assigned to this delivery") {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message === "You do not have permission to update this assignment"
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.startsWith("Invalid assignment status transition:")) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Delivery assignment status update failed",
    });
  }
};

const getMyAssignments = async (req, res) => {
  try {
    const assignments = await deliveryAssignmentService.getAssignmentsByAgentId(
      req.user.userId,
    );

    return res.status(200).json({
      success: true,
      message: "Delivery assignments fetched successfully",
      data: assignments,
    });
  } catch (error) {
    console.error("Fetch delivery assignments error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch delivery assignments",
    });
  }
};

const getAssignmentDetails = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    if (!assignmentId || !/^\d+$/.test(String(assignmentId))) {
      return res.status(400).json({
        success: false,
        message: "Valid assignment ID is required",
      });
    }

    const assignment = await deliveryAssignmentService.getAssignmentDetails({
      assignmentId,
      actorId: req.user.userId,
      actorRole: req.user.roleName,
    });

    return res.status(200).json({
      success: true,
      message: "Delivery assignment details fetched successfully",
      data: assignment,
    });
  } catch (error) {
    console.error("Fetch delivery assignment details error:", error.message);

    if (error.message === "Delivery assignment not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "You are not assigned to this delivery") {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message === "You do not have permission to view this assignment"
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch delivery assignment details",
    });
  }
};

module.exports = {
  assignDeliveryAgent,
  updateAssignmentStatus,
  getMyAssignments,
  getAssignmentDetails,
};

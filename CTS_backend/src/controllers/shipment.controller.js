const shipmentService = require("../services/shipment.service");

const { successResponse, errorResponse } = require("../utils/api-response");

const ERROR_CODES = require("../utils/error-codes");

const {
  validateCreateShipmentInput,
} = require("../validators/shipment.validator");

const {
  validateUpdateShipmentStatusInput,
} = require("../validators/shipment-status.validator");

const createShipment = async (req, res) => {
  try {
    const {
      receiverName,
      receiverPhone,
      receiverEmail,
      receiverAddress,
      receiverCity,
      receiverState,
      receiverPostalCode,
      expectedDelivery,
    } = req.body;

    const validation = validateCreateShipmentInput({
      receiverName,
      receiverPhone,
      receiverEmail,
      receiverAddress,
      receiverCity,
      receiverState,
      receiverPostalCode,
      expectedDelivery,
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const result = await shipmentService.createShipment({
      senderId: req.user.userId,
      receiverName: receiverName.trim(),
      receiverPhone: receiverPhone.trim(),
      receiverEmail: receiverEmail ? receiverEmail.trim().toLowerCase() : null,
      receiverAddress: receiverAddress.trim(),
      receiverCity: receiverCity.trim(),
      receiverState: receiverState ? receiverState.trim() : null,
      receiverPostalCode: receiverPostalCode ? receiverPostalCode.trim() : null,
      expectedDelivery: expectedDelivery || null,
    });

    return res.status(201).json({
      success: true,
      message: "Shipment created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Shipment creation error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Shipment creation failed",
    });
  }
};

const getShipmentTracking = async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    if (!trackingNumber || trackingNumber.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Tracking number is required",
      });
    }

    const result = await shipmentService.getShipmentTracking(
      trackingNumber.trim(),
    );

    return res.status(200).json({
      success: true,
      message: "Shipment tracking fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Shipment tracking error:", error.message);

    if (error.message === "Shipment not found") {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch shipment tracking",
    });
  }
};

const updateShipmentStatus = async (req, res) => {
  try {
    const { shipmentId } = req.params;

    const { nextStatus, hubId, location, description } = req.body;

    const validation = validateUpdateShipmentStatusInput({
      nextStatus,
      location,
      description,
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const result = await shipmentService.updateShipmentStatus({
      shipmentId,
      nextStatus,
      hubId: hubId || null,
      description: description ? description.trim() : null,
      actorId: req.user.userId,
    });

    return res.status(200).json({
      success: true,
      message: "Shipment status updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Shipment status update error:", error.message);

    if (error.message === "Shipment not found") {
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

    if (error.message === "Hub staff is not assigned to a hub") {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Hub staff cannot perform this status update") {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Hub staff is not authorized for this shipment") {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Delivery agent is not assigned to this shipment") {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Delivery agent cannot perform this status update") {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.startsWith("Invalid status transition:")) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Shipment status update failed",
    });
  }
};

const cancelShipment = async (req, res) => {
  try {
    const { shipmentId } = req.params;

    if (!shipmentId || !/^\d+$/.test(String(shipmentId))) {
      return res.status(400).json({
        success: false,
        message: "Valid shipment ID is required",
      });
    }

    const result = await shipmentService.cancelShipment({
      shipmentId,
      customerId: req.user.userId,
    });

    return res.status(200).json({
      success: true,
      message: "Shipment cancelled successfully",
      data: result,
    });
  } catch (error) {
    console.error("Shipment cancellation error:", error.message);

    if (error.message === "Shipment not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "You can only cancel your own shipment") {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message.startsWith("Shipment cannot be cancelled from status:")) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Shipment cancellation failed",
    });
  }
};

const getMyShipments = async (req, res) => {
  try {
    const shipments = await shipmentService.getMyShipments(req.user.userId);

    return res.status(200).json({
      success: true,
      message: "Customer shipments fetched successfully",
      data: shipments,
    });
  } catch (error) {
    console.error("Fetch customer shipments error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer shipments",
    });
  }
};

const getMyShipmentDetails = async (req, res) => {
  try {
    const { shipmentId } = req.params;

    // Validate shipment ID from URL
    if (!shipmentId || !/^\d+$/.test(String(shipmentId))) {
      return res.status(400).json({
        success: false,
        message: "Valid shipment ID is required",
      });
    }

    const result = await shipmentService.getMyShipmentDetails({
      shipmentId,
      senderId: req.user.userId,
    });

    return res.status(200).json({
      success: true,
      message: "Shipment details fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Fetch customer shipment details error:", error.message);

    if (error.message === "Shipment not found") {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch shipment details",
    });
  }
};

const getAllShipments = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const status = req.query.status
      ? String(req.query.status).trim().toUpperCase()
      : null;

    const search = req.query.search ? String(req.query.search).trim() : null;

    if (!Number.isInteger(page) || page < 1) {
      return res.status(400).json({
        success: false,
        message: "Page must be a positive integer",
      });
    }

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: "Limit must be between 1 and 100",
      });
    }

    const allowedStatuses = [
      "BOOKED",
      "PICKED_UP",
      "ORIGIN_HUB",
      "IN_TRANSIT",
      "DESTINATION_HUB",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "DELIVERY_FAILED",
      "CANCELLED",
    ];

    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid shipment status",
      });
    }

    const result = await shipmentService.getAllShipments({
      page,
      limit,
      status,
      search,
    });

    return res.status(200).json({
      success: true,
      message: "Shipments fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Fetch all shipments error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch shipments",
    });
  }
};

const getAdminShipmentDetails = async (req, res) => {
  try {
    const { shipmentId } = req.params;

    if (!shipmentId || !/^\d+$/.test(String(shipmentId))) {
      return res.status(400).json({
        success: false,
        message: "Valid shipment ID is required",
      });
    }

    const result = await shipmentService.getAdminShipmentDetails(shipmentId);

    return res.status(200).json({
      success: true,
      message: "Shipment details fetched successfully",
      data: result,
    });
  } catch (error) {
    console.error("Fetch admin shipment details error:", error.message);

    if (error.message === "Shipment not found") {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch shipment details",
    });
  }
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

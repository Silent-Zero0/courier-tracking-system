const hubService = require("../services/hub.service");

const {
  validateAssignHubsInput,
} = require("../validators/shipment-hub.validator");

const assignShipmentHubs = async (req, res) => {
  try {
    const { shipmentId } = req.params;

    const { originHubId, destinationHubId } = req.body;

    // Validate shipment ID
    if (!shipmentId || !/^\d+$/.test(shipmentId)) {
      return res.status(400).json({
        success: false,
        message: "Valid shipment ID is required",
      });
    }

    // Validate hub assignment input
    const validation = validateAssignHubsInput({
      originHubId,
      destinationHubId,
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const shipment = await hubService.assignShipmentHubs(shipmentId, {
      originHubId,
      destinationHubId,
    });

    return res.status(200).json({
      success: true,
      message: "Shipment hubs assigned successfully",
      data: shipment,
    });
  } catch (error) {
    console.error("Shipment hub assignment error:", error.message);

    if (error.message === "Shipment not found") {
      return res.status(404).json({
        success: false,
        message: "Shipment not found",
      });
    }

    if (error.message === "Origin hub not found") {
      return res.status(404).json({
        success: false,
        message: "Origin hub not found",
      });
    }

    if (error.message === "Destination hub not found") {
      return res.status(404).json({
        success: false,
        message: "Destination hub not found",
      });
    }

    if (error.message === "Origin hub is not active") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Destination hub is not active") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === "Origin and destination hubs must be different") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Shipment hub assignment failed",
    });
  }
};

module.exports = {
  assignShipmentHubs,
};

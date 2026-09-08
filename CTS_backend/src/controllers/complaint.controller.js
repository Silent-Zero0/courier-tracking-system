const complaintService = require("../services/complaint.service");

const {
  validateCreateComplaintInput,
  validateUpdateComplaintStatusInput,
} = require("../validators/complaint.validator");

const createComplaint = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    const { category, description, priority } = req.body;

    if (!shipmentId || !/^\d+$/.test(String(shipmentId))) {
      return res.status(400).json({
        success: false,
        message: "Valid shipment ID is required",
      });
    }

    const validation = validateCreateComplaintInput({
      shipmentId,
      category,
      description,
      priority,
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const complaint = await complaintService.createComplaint({
      shipmentId,
      customerId: req.user.userId,
      category: category.trim().toUpperCase(),
      description: description.trim(),
      priority: priority
        ? priority.trim().toUpperCase()
        : "MEDIUM",
    });

    return res.status(201).json({
      success: true,
      message: "Complaint created successfully",
      data: complaint,
    });
  } catch (error) {
    console.error("Complaint creation error:", error.message);

    if (error.message === "Shipment not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message ===
      "You can only complain about your own shipment"
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message ===
      "An active complaint already exists for this shipment"
    ) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Complaint creation failed",
    });
  }
};

const getMyComplaints = async (req, res) => {
  try {
    const complaints = await complaintService.getMyComplaints(
      req.user.userId,
    );

    return res.status(200).json({
      success: true,
      message: "Complaints fetched successfully",
      data: complaints,
    });
  } catch (error) {
    console.error("Fetch complaints error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaints",
    });
  }
};

const getComplaintById = async (req, res) => {
  try {
    const { complaintId } = req.params;

    if (!complaintId || !/^\d+$/.test(String(complaintId))) {
      return res.status(400).json({
        success: false,
        message: "Valid complaint ID is required",
      });
    }

    const complaint = await complaintService.getComplaintById({
      complaintId,
      actorId: req.user.userId,
      actorRole: req.user.roleName,
    });

    return res.status(200).json({
      success: true,
      message: "Complaint fetched successfully",
      data: complaint,
    });
  } catch (error) {
    console.error("Complaint fetch error:", error.message);

    if (error.message === "Complaint not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message ===
      "You do not have permission to view this complaint"
    ) {
      return res.status(403).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaint",
    });
  }
};

const getAllComplaints = async (req, res) => {
  try {
    const complaints = await complaintService.getAllComplaints();

    return res.status(200).json({
      success: true,
      message: "All complaints fetched successfully",
      data: complaints,
    });
  } catch (error) {
    console.error("Complaint list error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch complaints",
    });
  }
};

const updateComplaintStatus = async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status } = req.body;

    if (!complaintId || !/^\d+$/.test(String(complaintId))) {
      return res.status(400).json({
        success: false,
        message: "Valid complaint ID is required",
      });
    }

    const validation = validateUpdateComplaintStatusInput(status);

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const complaint = await complaintService.updateComplaintStatus({
      complaintId,
      nextStatus: status.trim().toUpperCase(),
    });

    return res.status(200).json({
      success: true,
      message: "Complaint status updated successfully",
      data: complaint,
    });
  } catch (error) {
    console.error(
      "Complaint status update error:",
      error.message,
    );

    if (error.message === "Complaint not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (
      error.message.startsWith(
        "Invalid complaint status transition:",
      )
    ) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Complaint status update failed",
    });
  }
};

module.exports = {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  getAllComplaints,
  updateComplaintStatus,
};
const hubService = require("../services/hub.service");

const {
  validateCreateHubInput,
  validateUpdateHubInput,
} = require("../validators/hub.validator");

const createHub = async (req, res) => {
  try {
    const { name, code, city, address } = req.body;

    const validation = validateCreateHubInput({
      name,
      code,
      city,
      address,
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const hub = await hubService.createHub({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      city: city.trim(),
      address: address.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Hub created successfully",
      data: hub,
    });
  } catch (error) {
    console.error("Hub creation error:", error.message);

    if (error.message === "Hub with this code already exists") {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Hub creation failed",
    });
  }
};

const getHubById = async (req, res) => {
  try {
    const { hubId } = req.params;

    if (!hubId || !/^\d+$/.test(hubId)) {
      return res.status(400).json({
        success: false,
        message: "Valid hub ID is required",
      });
    }

    const hub = await hubService.getHubById(hubId);

    return res.status(200).json({
      success: true,
      message: "Hub fetched successfully",
      data: hub,
    });
  } catch (error) {
    console.error("Hub fetch error:", error.message);

    if (error.message === "Hub not found") {
      return res.status(404).json({
        success: false,
        message: "Hub not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch hub",
    });
  }
};

const getAllHubs = async (req, res) => {
  try {
    const hubs = await hubService.getAllHubs();

    return res.status(200).json({
      success: true,
      message: "Hubs fetched successfully",
      data: hubs,
    });
  } catch (error) {
    console.error("Hub list error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch hubs",
    });
  }
};

const updateHub = async (req, res) => {
  try {
    const { hubId } = req.params;

    if (!hubId || !/^\d+$/.test(hubId)) {
      return res.status(400).json({
        success: false,
        message: "Valid hub ID is required",
      });
    }

    const { name, city, address, status } = req.body;

    const validation = validateUpdateHubInput({
      name,
      city,
      address,
      status,
    });

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.errors,
      });
    }

    const hub = await hubService.updateHub(hubId, {
      name: name.trim(),
      city: city.trim(),
      address: address.trim(),
      status,
    });

    return res.status(200).json({
      success: true,
      message: "Hub updated successfully",
      data: hub,
    });
  } catch (error) {
    console.error("Hub update error:", error.message);

    if (error.message === "Hub not found") {
      return res.status(404).json({
        success: false,
        message: "Hub not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Hub update failed",
    });
  }
};

module.exports = {
  createHub,
  getHubById,
  getAllHubs,
  updateHub,
};

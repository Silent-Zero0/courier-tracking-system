const { isValidStatus } = require("../utils/shipment-status");

const validateUpdateShipmentStatusInput = ({
  nextStatus,
  location,
  description,
}) => {
  const errors = {};

  if (!nextStatus) {
    errors.nextStatus = "Next status is required";
  } else if (!isValidStatus(nextStatus)) {
    errors.nextStatus = "Invalid shipment status";
  }

  if (location !== undefined && location !== null) {
    if (typeof location !== "string" || location.trim().length < 2) {
      errors.location = "Location must be at least 2 characters";
    }
  }

  if (description !== undefined && description !== null) {
    if (typeof description !== "string" || description.trim().length < 2) {
      errors.description = "Description must be at least 2 characters";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

module.exports = {
  validateUpdateShipmentStatusInput,
};

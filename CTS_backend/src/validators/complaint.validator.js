const COMPLAINT_CATEGORIES = [
  "DELAY",
  "WRONG_STATUS",
  "DAMAGED",
  "ADDRESS",
  "DELIVERY",
  "OTHER",
];

const COMPLAINT_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const validateCreateComplaintInput = ({
  shipmentId,
  category,
  description,
  priority,
}) => {
  const errors = [];

  if (
    shipmentId === undefined ||
    shipmentId === null ||
    !/^\d+$/.test(String(shipmentId))
  ) {
    errors.push("Valid shipment ID is required");
  }

  if (!category || typeof category !== "string") {
    errors.push("Complaint category is required");
  } else if (!COMPLAINT_CATEGORIES.includes(category.trim().toUpperCase())) {
    errors.push("Invalid complaint category");
  }

  if (!description || typeof description !== "string") {
    errors.push("Complaint description is required");
  } else if (description.trim().length < 5) {
    errors.push("Complaint description must be at least 5 characters");
  }

  if (priority !== undefined && priority !== null) {
    if (
      typeof priority !== "string" ||
      !COMPLAINT_PRIORITIES.includes(priority.trim().toUpperCase())
    ) {
      errors.push("Invalid complaint priority");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const COMPLAINT_STATUSES = ["OPEN", "UNDER_REVIEW", "RESOLVED"];

const validateUpdateComplaintStatusInput = (status) => {
  const errors = [];

  if (!status || typeof status !== "string") {
    errors.push("Complaint status is required");
  } else if (!COMPLAINT_STATUSES.includes(status.trim().toUpperCase())) {
    errors.push("Invalid complaint status");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

module.exports = {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
  validateCreateComplaintInput,
  validateUpdateComplaintStatusInput,
};

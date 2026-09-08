const DELIVERY_ASSIGNMENT_STATUS = Object.freeze({
  ASSIGNED: "ASSIGNED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
});

const ALLOWED_ASSIGNMENT_TRANSITIONS = {
  ASSIGNED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "FAILED", "CANCELLED"],
  COMPLETED: [],
  FAILED: ["IN_PROGRESS"],
  CANCELLED: [],
};

const isValidAssignmentStatus = (status) => {
  return Object.values(DELIVERY_ASSIGNMENT_STATUS).includes(status);
};

const isValidAssignmentTransition = (
  currentStatus,
  nextStatus,
) => {
  if (!isValidAssignmentStatus(currentStatus)) {
    return false;
  }

  if (!isValidAssignmentStatus(nextStatus)) {
    return false;
  }

  return ALLOWED_ASSIGNMENT_TRANSITIONS[
    currentStatus
  ].includes(nextStatus);
};

module.exports = {
  DELIVERY_ASSIGNMENT_STATUS,
  ALLOWED_ASSIGNMENT_TRANSITIONS,
  isValidAssignmentStatus,
  isValidAssignmentTransition,
};
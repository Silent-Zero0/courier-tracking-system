const SHIPMENT_STATUS = Object.freeze({
  BOOKED: "BOOKED",
  PICKED_UP: "PICKED_UP",
  ORIGIN_HUB: "ORIGIN_HUB",
  IN_TRANSIT: "IN_TRANSIT",
  DESTINATION_HUB: "DESTINATION_HUB",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  DELIVERY_FAILED: "DELIVERY_FAILED",
  CANCELLED: "CANCELLED",
});

const ALLOWED_TRANSITIONS = {
  BOOKED: ["PICKED_UP", "CANCELLED"],

  PICKED_UP: ["ORIGIN_HUB", "DELIVERY_FAILED", "CANCELLED"],

  ORIGIN_HUB: ["IN_TRANSIT", "CANCELLED"],

  IN_TRANSIT: ["DESTINATION_HUB", "DELIVERY_FAILED"],

  DESTINATION_HUB: ["OUT_FOR_DELIVERY"],

  OUT_FOR_DELIVERY: ["DELIVERED", "DELIVERY_FAILED"],

  DELIVERY_FAILED: ["OUT_FOR_DELIVERY", "CANCELLED"],

  DELIVERED: [],

  CANCELLED: [],
};

const isValidStatus = (status) => {
  return Object.values(SHIPMENT_STATUS).includes(status);
};

const isValidTransition = (currentStatus, nextStatus) => {
  if (!isValidStatus(currentStatus)) {
    return false;
  }

  if (!isValidStatus(nextStatus)) {
    return false;
  }

  return ALLOWED_TRANSITIONS[currentStatus].includes(nextStatus);
};

module.exports = {
  SHIPMENT_STATUS,
  ALLOWED_TRANSITIONS,
  isValidStatus,
  isValidTransition,
};

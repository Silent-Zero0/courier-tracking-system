const validateAssignDeliveryAgentInput = ({ shipmentId, agentId }) => {
  const errors = {};

  if (
    shipmentId === undefined ||
    shipmentId === null ||
    !/^\d+$/.test(String(shipmentId))
  ) {
    errors.shipmentId = "Valid shipment ID is required";
  }

  if (
    agentId === undefined ||
    agentId === null ||
    !/^\d+$/.test(String(agentId))
  ) {
    errors.agentId = "Valid delivery agent ID is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

module.exports = {
  validateAssignDeliveryAgentInput,
};

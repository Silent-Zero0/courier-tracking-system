const validateAssignHubsInput = ({ originHubId, destinationHubId }) => {
  const errors = {};

  if (
    originHubId === undefined ||
    originHubId === null ||
    !/^\d+$/.test(String(originHubId))
  ) {
    errors.originHubId = "Valid origin hub ID is required";
  }

  if (
    destinationHubId === undefined ||
    destinationHubId === null ||
    !/^\d+$/.test(String(destinationHubId))
  ) {
    errors.destinationHubId = "Valid destination hub ID is required";
  }

  if (
    originHubId !== undefined &&
    destinationHubId !== undefined &&
    String(originHubId) === String(destinationHubId)
  ) {
    errors.destinationHubId = "Origin and destination hubs must be different";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

module.exports = {
  validateAssignHubsInput,
};

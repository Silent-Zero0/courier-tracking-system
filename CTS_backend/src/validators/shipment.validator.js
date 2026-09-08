const validateCreateShipmentInput = ({
  receiverName,
  receiverPhone,
  receiverEmail,
  receiverAddress,
  receiverCity,
  receiverState,
  receiverPostalCode,
  expectedDelivery,
}) => {
  const errors = {};

  if (!receiverName || receiverName.trim().length < 2) {
    errors.receiverName = "Receiver name must be at least 2 characters";
  }

  if (!receiverPhone || !/^[0-9+\-\s()]{7,20}$/.test(receiverPhone)) {
    errors.receiverPhone = "Please provide a valid receiver phone number";
  }

  if (receiverEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(receiverEmail)) {
    errors.receiverEmail = "Please provide a valid receiver email";
  }

  if (!receiverAddress || receiverAddress.trim().length < 5) {
    errors.receiverAddress = "Receiver address is required";
  }

  if (!receiverCity || receiverCity.trim().length < 2) {
    errors.receiverCity = "Receiver city is required";
  }

  if (receiverState && receiverState.trim().length < 2) {
    errors.receiverState = "Receiver state is invalid";
  }

  if (
    receiverPostalCode &&
    !/^[A-Za-z0-9\s-]{3,20}$/.test(receiverPostalCode)
  ) {
    errors.receiverPostalCode = "Receiver postal code is invalid";
  }

  if (expectedDelivery) {
    const deliveryDate = new Date(expectedDelivery);

    if (Number.isNaN(deliveryDate.getTime())) {
      errors.expectedDelivery = "Expected delivery date is invalid";
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

module.exports = {
  validateCreateShipmentInput,
};

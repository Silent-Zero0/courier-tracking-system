const validateCreateHubInput = ({ name, code, city, address }) => {
  const errors = {};

  if (!name || name.trim().length < 2) {
    errors.name = "Hub name must be at least 2 characters";
  }

  if (!code || code.trim().length < 2 || code.trim().length > 20) {
    errors.code = "Hub code must be between 2 and 20 characters";
  }

  if (!city || city.trim().length < 2) {
    errors.city = "Hub city must be at least 2 characters";
  }

  if (!address || address.trim().length < 5) {
    errors.address = "Hub address must be at least 5 characters";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

const validateUpdateHubInput = ({ name, city, address, status }) => {
  const errors = {};

  if (!name || name.trim().length < 2) {
    errors.name = "Hub name must be at least 2 characters";
  }

  if (!city || city.trim().length < 2) {
    errors.city = "Hub city must be at least 2 characters";
  }

  if (!address || address.trim().length < 5) {
    errors.address = "Hub address must be at least 5 characters";
  }

  if (!["ACTIVE", "INACTIVE"].includes(status)) {
    errors.status = "Hub status must be ACTIVE or INACTIVE";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

module.exports = {
  validateCreateHubInput,
  validateUpdateHubInput,
};

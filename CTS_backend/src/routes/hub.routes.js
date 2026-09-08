const express = require("express");

const hubController = require("../controllers/hub.controller");

const { authenticate } = require("../middleware/auth.middleware");

const { allowRoles } = require("../middleware/role.middleware");

const router = express.Router();

router.post("/", authenticate, allowRoles("ADMIN"), hubController.createHub);

router.get(
  "/",
  authenticate,
  allowRoles("ADMIN", "HUB_STAFF"),
  hubController.getAllHubs,
);

router.get(
  "/:hubId",
  authenticate,
  allowRoles("ADMIN", "HUB_STAFF"),
  hubController.getHubById,
);

router.patch(
  "/:hubId",
  authenticate,
  allowRoles("ADMIN"),
  hubController.updateHub,
);

module.exports = router;

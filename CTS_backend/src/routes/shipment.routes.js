const express = require("express");

const shipmentController = require("../controllers/shipment.controller");
const shipmentHubController = require("../controllers/shipment-hub.controller");

const { authenticate } = require("../middleware/auth.middleware");

const { allowRoles } = require("../middleware/role.middleware");

const router = express.Router();

router.get("/track/:trackingNumber", shipmentController.getShipmentTracking);

router.get(
  "/",
  authenticate,
  allowRoles("ADMIN"),
  shipmentController.getAllShipments,
);

router.get(
  "/my",
  authenticate,
  allowRoles("CUSTOMER"),
  shipmentController.getMyShipments,
);

router.get(
  "/my/:shipmentId",
  authenticate,
  allowRoles("CUSTOMER"),
  shipmentController.getMyShipmentDetails,
);

router.get(
  "/:shipmentId",
  authenticate,
  allowRoles("ADMIN"),
  shipmentController.getAdminShipmentDetails,
);

router.patch(
  "/:shipmentId/cancel",
  authenticate,
  allowRoles("CUSTOMER"),
  shipmentController.cancelShipment,
);

router.post(
  "/",
  authenticate,
  allowRoles("CUSTOMER"),
  shipmentController.createShipment,
);

router.patch(
  "/:shipmentId/status",
  authenticate,
  allowRoles("ADMIN", "HUB_STAFF", "DELIVERY_AGENT"),
  shipmentController.updateShipmentStatus,
);

router.patch(
  "/:shipmentId/hubs",
  authenticate,
  allowRoles("ADMIN"),
  shipmentHubController.assignShipmentHubs,
);

module.exports = router;

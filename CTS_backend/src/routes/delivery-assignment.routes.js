const express = require("express");

const deliveryAssignmentController = require("../controllers/delivery-assignment.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { allowRoles } = require("../middleware/role.middleware");

const router = express.Router();

router.post(
  "/:shipmentId/assign",
  authenticate,
  allowRoles("ADMIN"),
  deliveryAssignmentController.assignDeliveryAgent,
);

router.patch(
  "/assignments/:assignmentId/status",
  authenticate,
  allowRoles("ADMIN", "DELIVERY_AGENT"),
  deliveryAssignmentController.updateAssignmentStatus,
);

router.get(
  "/assignments/my",
  authenticate,
  allowRoles("DELIVERY_AGENT"),
  deliveryAssignmentController.getMyAssignments,
);

router.get(
  "/assignments/:assignmentId",
  authenticate,
  allowRoles("ADMIN", "DELIVERY_AGENT"),
  deliveryAssignmentController.getAssignmentDetails,
);

module.exports = router;

const express = require("express");

const complaintController = require("../controllers/complaint.controller");

const { authenticate } = require("../middleware/auth.middleware");
const { allowRoles } = require("../middleware/role.middleware");

const router = express.Router();

// Customer creates a complaint for their shipment
router.post(
  "/shipments/:shipmentId",
  authenticate,
  allowRoles("CUSTOMER"),
  complaintController.createComplaint,
);

// Customer views their own complaints
router.get(
  "/my",
  authenticate,
  allowRoles("CUSTOMER"),
  complaintController.getMyComplaints,
);

// Customer or Admin views a specific complaint
router.get(
  "/:complaintId",
  authenticate,
  allowRoles("CUSTOMER", "ADMIN"),
  complaintController.getComplaintById,
);

// Admin views all complaints
router.get(
  "/",
  authenticate,
  allowRoles("ADMIN"),
  complaintController.getAllComplaints,
);

// Admin updates complaint status
router.patch(
  "/:complaintId/status",
  authenticate,
  allowRoles("ADMIN"),
  complaintController.updateComplaintStatus,
);

module.exports = router;
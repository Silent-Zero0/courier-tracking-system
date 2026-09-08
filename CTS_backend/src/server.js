require("dotenv").config();

const express = require("express");

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const shipmentRoutes = require("./routes/shipment.routes");
const deliveryAssignmentRoutes = require("./routes/delivery-assignment.routes");
const hubRoutes = require("./routes/hub.routes");
const complaintRoutes = require("./routes/complaint.routes");
const notificationRoutes = require("./routes/notification.routes");

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/shipments", deliveryAssignmentRoutes);
app.use("/api/hubs", hubRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Courier Tracking System API is running",
  });
});

app.listen(PORT, () => {
  console.log(`CTS Backend running on port ${PORT}`);
});

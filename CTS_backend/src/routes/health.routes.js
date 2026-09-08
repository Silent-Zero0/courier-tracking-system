const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Courier Tracking System API is healthy",
  });
});

module.exports = router;

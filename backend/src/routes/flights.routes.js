const express = require("express");
const router = express.Router();
const flightController = require("../controllers/flights.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

router.post("/add", requireAuth("admin"), flightController.addFlight);
router.get("/all", flightController.getAllFlights);
router.get("/:flightNumber", flightController.getFlightByNumber);
router.put("/update/:flightNumber", requireAuth("admin"), flightController.updateFlight);
// router.delete("/delete/:flightNumber", flightController.deleteFlight);

module.exports = router;

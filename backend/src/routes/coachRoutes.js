const express = require("express");
const router = express.Router();

const {
  getCoaches,
  getCoachById,
  createCoach,
  updateCoach,
  deleteCoach
} = require("../controllers/coachController");

router.get("/", getCoaches);
router.get("/:id", getCoachById);
router.post("/", createCoach);
router.put("/:id", updateCoach);
router.delete("/:id", deleteCoach);

module.exports = router;

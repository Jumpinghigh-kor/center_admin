const express = require("express");
const router = express.Router();
const {
  getCenter,
  updateCenter,
  getCenterCount,
  getCenterList,
  updateCenterAddress,
} = require("../controllers/center");

router.get("/", getCenter);
router.patch("/", updateCenter);
router.get("/members", getCenterCount);
router.get("/list", getCenterList);
router.patch("/address", updateCenterAddress);

module.exports = router;

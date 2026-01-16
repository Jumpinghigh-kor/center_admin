const express = require("express");
const router = express.Router();
const {
  getCenter,
  updateCenter,
  getCenterCount,
  getCenterList,
  updateCenterAddress,
  deleteCenter,
  updateCenterName,
} = require("../controllers/center");

router.get("/", getCenter);
router.patch("/", updateCenter);
router.get("/members", getCenterCount);
router.get("/list", getCenterList);
router.patch("/address", updateCenterAddress);
router.delete("/", deleteCenter);
router.patch("/name", updateCenterName);

module.exports = router;

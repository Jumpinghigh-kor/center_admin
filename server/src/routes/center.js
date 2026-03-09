const express = require("express");
const router = express.Router();
const {
  getCenter,
  updateCenter,
  getCenterCount,
  getCenterList,
  deleteCenter,
  updateCenterName,
  updateOwnerCenterInfo,
} = require("../controllers/center");

router.get("/", getCenter);
router.patch("/", updateCenter);
router.get("/members", getCenterCount);
router.get("/list", getCenterList);
router.patch("/info", updateOwnerCenterInfo);
router.delete("/", deleteCenter);
router.patch("/name", updateCenterName);

module.exports = router;

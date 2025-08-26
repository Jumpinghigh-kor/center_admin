const express = require("express");
const router = express.Router();
const { getInfo, getInfoWithoutLimit } = require("../controllers/info");

router.get("/", getInfo);
router.get("/entire", getInfoWithoutLimit);

module.exports = router;

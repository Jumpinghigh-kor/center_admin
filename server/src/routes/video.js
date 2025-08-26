const express = require("express");
const router = express.Router();
const { getVideo } = require("../controllers/video");

//시간표 관리
router.get("/", getVideo);

module.exports = router;

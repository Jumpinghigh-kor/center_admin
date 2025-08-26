const express = require("express");
const router = express.Router();
const {
  selectCommonCodeList
} = require("../../controllers/app/common");

// 이벤트 목록 조회
router.post("/selectCommonCodeList", selectCommonCodeList);

module.exports = router;

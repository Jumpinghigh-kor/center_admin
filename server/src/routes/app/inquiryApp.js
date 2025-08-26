const express = require("express");
const router = express.Router();
const {
  selectInquiryAppList,
  updateInquiryApp,
} = require("../../controllers/app/inquiryApp");

// 문의 목록 조회
router.post("/selectInquiryAppList", selectInquiryAppList);

// 문의 답변
router.post("/updateInquiryApp", updateInquiryApp);

module.exports = router;

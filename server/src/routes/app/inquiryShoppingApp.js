const express = require("express");
const router = express.Router();
const {
  selectInquiryShoppingAppList,
  updateInquiryShoppingApp,
} = require("../../controllers/app/inquiryShoppingApp");

// 쇼핑몰 문의 목록 조회
router.post("/selectInquiryShoppingAppList", selectInquiryShoppingAppList);

module.exports = router;

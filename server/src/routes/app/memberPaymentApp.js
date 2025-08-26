const express = require("express");
const router = express.Router();
const {
  updateMemberPaymentApp,
} = require("../../controllers/app/memberPaymentApp");

// 결제 정보 수정
router.post("/updateMemberPaymentApp", updateMemberPaymentApp);

module.exports = router;

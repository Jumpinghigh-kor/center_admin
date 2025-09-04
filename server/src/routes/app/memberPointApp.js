const express = require("express");
const router = express.Router();
const {
  deleteMemberPointApp,
  updatePointAmount,
} = require("../../controllers/app/memberPointApp");

// 포인트 삭제
router.post("/deleteMemberPointApp", deleteMemberPointApp);

// 포인트 금액 수정
router.post("/updatePointAmount", updatePointAmount);

module.exports = router;

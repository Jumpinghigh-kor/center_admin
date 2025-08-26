const express = require("express");
const router = express.Router();
const {
  deleteMemberPointApp,
} = require("../../controllers/app/memberPointApp");

// 포인트 삭제
router.post("/deleteMemberPointApp", deleteMemberPointApp);

module.exports = router;

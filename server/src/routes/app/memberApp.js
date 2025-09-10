const express = require("express");
const router = express.Router();
const {
  selectMemberAppList,
} = require("../../controllers/app/memberApp");

// 어플 회원 목록 조회
router.post("/selectMemberAppList", selectMemberAppList);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  selectMemberAppList,
  createMemberApp,
  updateMemberAppInfo,
  updateMemberAppPassword,
} = require("../../controllers/app/memberApp");

// 어플 회원 목록 조회
router.post("/selectMemberAppList", selectMemberAppList);

// 어플 회원 생성
router.post("/createMemberApp", createMemberApp);

// 어플 회원 정보 수정
router.post("/updateMemberAppInfo", updateMemberAppInfo);

// 어플 회원 비밀번호 수정
router.post("/updateMemberAppPassword", updateMemberAppPassword);

module.exports = router;

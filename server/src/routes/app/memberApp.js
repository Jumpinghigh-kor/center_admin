const express = require("express");
const router = express.Router();
const {
  selectMemberAppList,
  createMemberApp,
  updateMemberAppInfo,
  updateMemberAppPassword,
  updateMemberActive,
  deleteMemberApp,
} = require("../../controllers/app/memberApp");

// 어플 회원 목록 조회
router.post("/selectMemberAppList", selectMemberAppList);

// 어플 회원 생성
router.post("/createMemberApp", createMemberApp);

// 어플 회원 정보 수정
router.post("/updateMemberAppInfo", updateMemberAppInfo);

// 어플 회원 비밀번호 수정
router.post("/updateMemberAppPassword", updateMemberAppPassword);

// 어플 회원 상태 활성화 (탈퇴 해제)
router.post("/updateMemberActive", updateMemberActive);

// 어플 회원 삭제
router.post("/deleteMemberApp", deleteMemberApp);

module.exports = router;

const express = require("express");
const router = express.Router();
const { insertMemberReturnApp, updateMemberReturnAppApproval, updateMemberReturnApp } = require("../../controllers/app/memberReturnApp");

// 회원 취소/반품/교환 접수
router.post("/insertMemberReturnApp", insertMemberReturnApp);     

// 반품/교환/취소 정보 수정
router.post("/updateMemberReturnApp", updateMemberReturnApp);

// 반품/교환/취소 승인 취소
router.post("/updateMemberReturnAppApproval", updateMemberReturnAppApproval);

module.exports = router;

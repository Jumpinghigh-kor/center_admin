const express = require("express");
const router = express.Router();
const {
  selectPostAppList,
  insertPostApp,
  insertMemberPostApp,
  deletePostApp,
  deleteMemberPostApp,
  testSendPostPush,
} = require("../../controllers/app/postApp");

// 우편함 목록 조회
router.post("/selectPostAppList", selectPostAppList);

// 우편함 등록
router.post("/insertPostApp", insertPostApp);

// 우편함 수정
router.post("/deletePostApp", deletePostApp);

// 회원 우편함 등록
router.post("/insertMemberPostApp", insertMemberPostApp);

// 회원 우편함 삭제
router.post("/deleteMemberPostApp", deleteMemberPostApp);

// 테스트용 푸시 발송 라우트
router.post("/testSendPostPush", testSendPostPush);

module.exports = router;

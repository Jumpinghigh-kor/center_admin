const express = require("express");
const router = express.Router();
const {
  selectPostAppList,
  insertPostApp,
  updatePostApp,
  insertMemberPostApp,
  deletePostApp,
  deleteMemberPostApp,
  selectMemberPostAppList,
} = require("../../controllers/app/postApp");

// 우편함 목록 조회
router.post("/selectPostAppList", selectPostAppList);

// 우편함 회원 목록 조회
router.post("/selectMemberPostAppList", selectMemberPostAppList);

// 우편함 등록
router.post("/insertPostApp", insertPostApp);


// 회원 우편함 등록
router.post("/insertMemberPostApp", insertMemberPostApp);

// 우편함 수정
router.post("/deletePostApp", deletePostApp);


module.exports = router;

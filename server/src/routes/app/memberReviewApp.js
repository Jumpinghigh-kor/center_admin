const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  selectMemberReviewAppList,
  selectMemberReviewAppImgList,
  deleteMemberReviewApp,
} = require("../../controllers/app/memberReviewApp");

// 리뷰 목록 조회
router.get("/selectMemberReviewAppList", selectMemberReviewAppList);

// 리뷰 이미지 조회
router.post("/selectMemberReviewAppImgList", selectMemberReviewAppImgList);

// 리뷰 삭제
router.post("/deleteMemberReviewApp", deleteMemberReviewApp);

module.exports = router;

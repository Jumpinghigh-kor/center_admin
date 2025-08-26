const express = require("express");
const router = express.Router();
const {
  createUpdateLog,
  createNotices,
  createGuidelines,
} = require("../controllers/news");

//업데이트 등록
router.post("/createUpdateLog", createUpdateLog);

//공지사항 등록
router.post("/createNotices", createNotices);

//안내사항 등록
router.post("/createGuideline", createGuidelines);

module.exports = router;
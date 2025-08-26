const express = require("express");
const router = express.Router();
const {
  selectEventAppList,
  selectEventAppImgList,
  insertEventApp,
  updateEventApp,
  deleteEventApp,
} = require("../../controllers/app/eventApp");

// 이벤트 목록 조회
router.post("/selectEventAppList", selectEventAppList);

// 이벤트 이미지 조회
router.post("/selectEventAppImgList", selectEventAppImgList);

// 이벤트 등록
router.post("/insertEventApp", insertEventApp);

// 이벤트 수정
router.post("/updateEventApp", updateEventApp);

// 이벤트 삭제
router.post("/deleteEventApp", deleteEventApp);

module.exports = router;

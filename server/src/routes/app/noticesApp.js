const express = require("express");
const router = express.Router();
const {
  selectNoticesAppList,
  insertNoticesApp,
  updateNoticesApp,
  batchDeleteNoticesApp,
  selectNoticesAppDetail,
} = require("../../controllers/app/noticesApp");

// 배너 목록 조회
router.post("/selectNoticesAppList", selectNoticesAppList);

// 공지사항 등록
router.post("/insertNoticesApp", insertNoticesApp);

// 공지사항 수정
router.post("/updateNoticesApp", updateNoticesApp);

// 공지사항 일괄 삭제
router.post("/batchDeleteNoticesApp", batchDeleteNoticesApp);

// 공지사항 상세 조회
router.post("/selectNoticesAppDetail", selectNoticesAppDetail);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  selectNoticesShoppingAppList,
  insertNoticesShoppingApp,
  updateNoticesShoppingApp,
  batchDeleteNoticesShoppingApp,
  selectNoticesShoppingAppDetail,
} = require("../../controllers/app/noticesShoppingApp");

// 배너 목록 조회
router.post("/selectNoticesShoppingAppList", selectNoticesShoppingAppList);

// 공지사항 등록
router.post("/insertNoticesShoppingApp", insertNoticesShoppingApp);

// 공지사항 수정
router.post("/updateNoticesShoppingApp", updateNoticesShoppingApp);

// 공지사항 일괄 삭제
router.post("/batchDeleteNoticesShoppingApp", batchDeleteNoticesShoppingApp);

// 공지사항 상세 조회
router.post("/selectNoticesShoppingAppDetail", selectNoticesShoppingAppDetail);

module.exports = router;

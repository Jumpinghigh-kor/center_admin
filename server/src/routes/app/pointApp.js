const express = require("express");
const router = express.Router();
const {
  selectPointAppList,
  insertPointApp,
  updatePointApp,
  deletePointApp,
} = require("../../controllers/app/pointApp");

// 포인트 목록 조회
router.post("/selectPointAppList", selectPointAppList);

// 포인트 등록
router.post("/insertPointApp", insertPointApp);

// 포인트 수정
router.post("/updatePointApp", updatePointApp);

// 포인트 삭제
router.post("/deletePointApp", deletePointApp);


module.exports = router;

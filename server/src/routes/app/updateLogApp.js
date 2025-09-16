const express = require("express");
const router = express.Router();
const {
  selectUpdateLogAppList,
  selectUpdateLogAppDetail,
  selectUpdateLogAppVersionCheck,
  insertUpdateLogApp,
  updateUpdateLogApp,
  batchDeleteUpdateLogApp,
} = require("../../controllers/app/updateLogApp");

// 배너 목록 조회
router.post("/selectUpdateLogAppList", selectUpdateLogAppList);

// 업데이트 로그 상세 조회
router.post("/selectUpdateLogAppDetail", selectUpdateLogAppDetail);

// 공지사항 등록
router.post("/insertUpdateLogApp", insertUpdateLogApp);

// 공지사항 수정
router.post("/updateUpdateLogApp", updateUpdateLogApp);

// 공지사항 일괄 삭제
router.post("/batchDeleteUpdateLogApp", batchDeleteUpdateLogApp);

// 업데이트 로그 버전 중복 체크
router.post("/selectUpdateLogAppVersionCheck", selectUpdateLogAppVersionCheck);

module.exports = router;

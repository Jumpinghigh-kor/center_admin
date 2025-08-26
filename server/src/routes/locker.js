const express = require("express");
const router = express.Router();
const {
  getLockerBas,
  getLockerDetail,
  modifyLockerBas,
  deleteLockerBas,
  modifyLockerDetail,
} = require("../controllers/locker");

// 라커 기본 정보 조회
router.get("/getLockerBas", getLockerBas);
// 라커 기본 정보 등록 및 수정
router.post("/modifyLockerBas", modifyLockerBas);
// 라커 기본 정보 삭제
router.patch("/deleteLockerBas", deleteLockerBas);
// 라커 상세 정보 조회
router.get("/getLockerDetail", getLockerDetail);
// 라커 상세 정보 등록
router.post("/modifyLockerDetail", modifyLockerDetail);

module.exports = router;
const express = require("express");
const router = express.Router();
const {
  selectMemberCouponAppList,
  selectCouponAppList,
  insertCouponApp,
  updateCouponApp,
  deleteCouponApp,
} = require("../../controllers/app/couponApp");

// 쿠폰 목록 조회
router.get("/selectCouponAppList", selectCouponAppList);

// 쿠폰 회원 목록 조회
router.post("/selectMemberCouponAppList", selectMemberCouponAppList);

// 쿠폰 등록
router.post("/insertCouponApp", insertCouponApp);

// 쿠폰 수정
router.post("/updateCouponApp", updateCouponApp);

// 쿠폰 삭제
router.post("/deleteCouponApp", deleteCouponApp);

module.exports = router;

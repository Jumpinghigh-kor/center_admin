const express = require("express");
const router = express.Router();
const { selectMemberList
        , selectMonthlyMemberList
        , selectMemberCount
        , selectSalesList 
        , selectPaymentMethodList
        , selectCategorySalesList
        , selectHourlySalesList
        , selectPaymentAnalysisList
} = require("../../controllers/app/dashboard");

// 총 가입 된 회원 목록 조회
router.post("/selectMemberList", selectMemberList);

// 월별 가입 된 회원수 조회
router.post("/selectMonthlyMemberList", selectMonthlyMemberList);

// 총 가입 된 회원수 조회
router.post("/selectMemberCount", selectMemberCount);

// 결제 분석 조회
router.post("/selectPaymentAnalysisList", selectPaymentAnalysisList);

// 매출 조회
router.post("/selectSalesList", selectSalesList);

// 결제 수단 조회
router.post("/selectPaymentMethodList", selectPaymentMethodList);

// 카테고리별 매출 조회
router.post("/selectCategorySalesList", selectCategorySalesList);

// 시간대별 매출 조회
router.post("/selectHourlySalesList", selectHourlySalesList);

module.exports = router;

const express = require("express");
const router = express.Router();
const bannerRouter = require("./app/banner");
const commonController = require("../controllers/app/common");
const noticesRouter = require("./app/noticesApp");
const noticesShoppingAppRouter = require("./app/noticesShoppingApp");
const productRouter = require("./app/productApp");
const updateLogAppRouter = require("./app/updateLogApp");
const memberOrderAppRouter = require("./app/memberOrderApp");
const memberReviewAppRouter = require("./app/memberReviewApp");
const couponAppRouter = require("./app/couponApp");
const inquiryAppRouter = require("./app/inquiryApp");
const inquiryShoppingAppRouter = require("./app/inquiryShoppingApp");
const eventAppRouter = require("./app/eventApp");
const exerciseAppRouter = require("./app/exerciseApp");
const dashboardRouter = require("./app/dashboard");
const commonRouter = require("./app/common");
const goodsflowRouter = require("./app/goodsflow");
const deliveryTrackerRouter = require("./app/deliveryTracker");
const memberReturnAppRouter = require("./app/memberReturnApp");
const portoneRouter = require("./app/portone");
const memberOrderAddressRouter = require("./app/memberOrderAddress");
const memberPointAppRouter = require("./app/memberPointApp");
const memberPaymentAppRouter = require("./app/memberPaymentApp");
const trackingServiceRouter = require("./app/trackingService");
const postAppRouter = require("./app/postApp");
const memberAppRouter = require("./app/memberApp");
const pointAppRouter = require("./app/pointApp");

// 배너 라우터 연결
router.use("/bannerApp", bannerRouter);

// 운동 라우트
router.use("/exerciseApp", exerciseAppRouter);

// 공지사항 라우트
router.use("/noticesApp", noticesRouter);

// 쇼핑몰 공지사항 라우트
router.use("/noticesShoppingApp", noticesShoppingAppRouter);

// 상품 라우트
router.use("/productApp", productRouter);

// 업데이트 로그 라우트
router.use("/updateLogApp", updateLogAppRouter);

// 회원 주문 라우트
router.use("/memberOrderApp", memberOrderAppRouter);

// 리뷰 라우트
router.use("/memberReviewApp", memberReviewAppRouter);

// 쿠폰 라우트
router.use("/couponApp", couponAppRouter);

// 문의 라우트
router.use("/inquiryApp", inquiryAppRouter);

// 쇼핑몰 문의 라우트
router.use("/inquiryShoppingApp", inquiryShoppingAppRouter);

// 이벤트 라우트
router.use("/eventApp", eventAppRouter);

// 대시보드 라우트
router.use("/dashboard", dashboardRouter);

// 공통 코드 라우트
router.use("/common", commonRouter);

// 굿스플로 라우트
router.use("/goodsflow", goodsflowRouter);

// Delivery Tracker 라우트
router.use("/delivery-tracker", deliveryTrackerRouter);

// 파일 라우트
router.post("/files", commonController.insertCommonFile);

// 회원 취소/반품/교환 라우트
router.use("/memberReturnApp", memberReturnAppRouter);

// 포트원 라우트
router.use("/portone", portoneRouter);

// 회원 주문 주소지 라우트
router.use("/memberOrderAddress", memberOrderAddressRouter);

// 회원 적립금 라우트
router.use("/memberPointApp", memberPointAppRouter);

// 회원 결제 라우트
router.use("/memberPaymentApp", memberPaymentAppRouter);

// 배송 추적 라우트
router.use("/trackingService", trackingServiceRouter);

// 우편함 라우트
router.use("/postApp", postAppRouter);

// 회원 라우트
router.use("/memberApp", memberAppRouter);

// 포인트 라우트
router.use("/pointApp", pointAppRouter);

module.exports = router;

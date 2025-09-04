const express = require("express");
const router = express.Router();
const { insertMemberReturnApp, updateMemberReturnAppApproval, updateMemberReturnApp, updateReturnGoodsflowId, updateReturnCustomerTrackingNumber, updateExchangeCompanyTrackingInfo } = require("../../controllers/app/memberReturnApp");

// 회원 취소/반품/교환 접수
router.post("/insertMemberReturnApp", insertMemberReturnApp);     

// 반품/교환/취소 정보 수정
router.post("/updateMemberReturnApp", updateMemberReturnApp);

// 반품/교환/취소 승인 취소
router.post("/updateMemberReturnAppApproval", updateMemberReturnAppApproval);

// 굿스플로 반품 아이디 입력
router.post("/updateReturnGoodsflowId", updateReturnGoodsflowId);

// 구매자 반품 송장 정보 입력 
router.post("/updateReturnCustomerTrackingNumber", updateReturnCustomerTrackingNumber);

// 교환 회사 송장 번호 입력
router.post("/updateExchangeCompanyTrackingInfo", updateExchangeCompanyTrackingInfo);


module.exports = router;

const express = require("express");
const router = express.Router();
const { 
    selectMemberOrderAppList
    , selectMemberOrderAppCount
    , updateMemberOrderAppMemo
    , selectProductAppImg
    , updateTrackingNumber
    , deleteTrackingNumber
    , updateOrderStatus
    , updateOrderGroup
    , updateGoodsflowId
    , updateNewMemberOrderApp
    , deleteMemberOrderApp
    , insertMemberOrderApp
    , insertMemberOrderDetailApp
    , selectCenterMemberOrderAppList } = require("../../controllers/app/memberOrderApp");

// 회원 주문 목록 조회
router.post("/selectMemberOrderAppList", selectMemberOrderAppList);

// 회원 주문 목록 갯수 조회
router.post("/selectMemberOrderAppCount", selectMemberOrderAppCount);

// 상품 이미지 조회
router.post("/selectProductAppImg", selectProductAppImg);

// 주문 메모 수정
router.post("/updateMemberOrderAppMemo", updateMemberOrderAppMemo);

// 송장번호 입력
router.post("/updateTrackingNumber", updateTrackingNumber);

// 송장번호 삭제
router.post("/deleteTrackingNumber", deleteTrackingNumber);

// 주문상태 변경
router.post("/updateOrderStatus", updateOrderStatus);

// 주문 그룹 변경
router.post("/updateOrderGroup", updateOrderGroup);

// 굿스플로 송장번호 입력
router.post("/updateGoodsflowId", updateGoodsflowId);

// 주문 수량 수정
router.post("/updateNewMemberOrderApp", updateNewMemberOrderApp);

// 주문 삭제
router.post("/deleteMemberOrderApp", deleteMemberOrderApp);

// 주문 등록
router.post("/insertMemberOrderApp", insertMemberOrderApp);

// 주문 상세 등록
router.post("/insertMemberOrderDetailApp", insertMemberOrderDetailApp);

// 회원 주문 목록 조회
router.post("/selectCenterMemberOrderAppList", selectCenterMemberOrderAppList);

module.exports = router;

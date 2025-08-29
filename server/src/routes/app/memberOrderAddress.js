const express = require("express");
const router = express.Router();
const { selectMemberOrderAddress, insertMemberOrderAddress, deleteMemberOrderAddress } = require("../../controllers/app/memberOrderAddress");

// 회원 주문 목록 조회
router.post("/selectMemberOrderAddress", selectMemberOrderAddress);

// 회원 주문 주소지 등록
router.post("/insertMemberOrderAddress", insertMemberOrderAddress);

// 회원 주문 주송지 삭제
router.post("/deleteMemberOrderAddress", deleteMemberOrderAddress);

module.exports = router;

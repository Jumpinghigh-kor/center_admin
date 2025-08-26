const express = require("express");
const router = express.Router();
const { selectMemberOrderAddress } = require("../../controllers/app/memberOrderAddress");

// 회원 주문 목록 조회
router.post("/selectMemberOrderAddress", selectMemberOrderAddress);


module.exports = router;

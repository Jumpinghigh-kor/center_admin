const express = require("express");
const router = express.Router();
const {
    requestPortOneRefund,
    getPortOneToken,
} = require("../../controllers/app/portone");

// 포트원 토큰 발급
router.post("/getPortOneToken", getPortOneToken);

// 포트원 환불 요청
router.post("/requestPortOneRefund", requestPortOneRefund);

module.exports = router;

const express = require("express");
const router = express.Router();
const {
  getInquiry,
  createInquiry,
  getInquiryDetail,
  getInquiryAddDetail,
  createInquiryAdd,
} = require("../controllers/inquiry");

//문의 남기기
router.get("/", getInquiry);
router.get("/:inquiryId", getInquiryDetail);
router.post("/", createInquiry);
router.get("/inquiryAdd/:inquiryId", getInquiryAddDetail);
router.post("/inquiryAdd", createInquiryAdd);

module.exports = router;

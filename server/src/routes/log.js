const express = require("express");
const router = express.Router();
const {
  getCheckinLog,
  createCheckinLog,
  selectMembership,
  deleteCheckinLog,
  getClientCallLog,
  createClientCallLog,
  updateClientCallLog,
  deleteClientCallLog,
  createCheckinLogbyMemId,
  selectTargetCheckinLogList,
} = require("../controllers/log");

//출입 내역
router.get("/checkin", getCheckinLog);
router.post("/checkin", createCheckinLog);
router.post("/checkin/selection", selectMembership);
router.post("/checkin/members", createCheckinLogbyMemId);
router.delete("/checkin/:id", deleteCheckinLog);
router.post("/checkin/target", selectTargetCheckinLogList);

//상담 기록
router.get("/clientCall", getClientCallLog);
router.post("/clientCall", createClientCallLog);
router.patch("/clientCall/:id", updateClientCallLog);
router.delete("/clientCall/:id", deleteClientCallLog);

module.exports = router;

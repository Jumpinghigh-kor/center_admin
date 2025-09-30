const express = require("express");
const router = express.Router();
const {
  getMember,
  createMember,
  updateMember,
  deleteMember,
  getMemberOrder,
  createMemberOrder,
  createBulkMemberOrder,
  updateMemberOrder,
  updateBulkMemoEndDt,
  deleteMemberOrder,
  getAttendance,
  getValidMemberOrder,
  getAllMemberList,
  updateMemberOrderPrice,
} = require("../controllers/member");

//회원 관리
router.get("/", getMember);
router.post("/", createMember);
router.patch("/:id", updateMember);
router.post("/delete/:id", deleteMember);
router.get("/order", getMemberOrder);
router.get("/validOrder", getValidMemberOrder);
router.post("/order", createMemberOrder);
router.post("/bulkOrder", createBulkMemberOrder);
router.post("/bulkMemoEndDt", updateBulkMemoEndDt);
router.patch("/order/:id", updateMemberOrder);
router.delete("/order/:id", deleteMemberOrder);
router.get("/attendance", getAttendance);
router.post("/allMemberList", getAllMemberList);
router.post("/orderPrice", updateMemberOrderPrice);

module.exports = router;

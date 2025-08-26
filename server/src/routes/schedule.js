const express = require("express");
const router = express.Router();
const {
  getSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getScheduleDetail,
  getScheduleDetailByDate,
  getMemberScheduleAppList,
  getReservationMemberList,
  getRegisteredMemberList,
  updateMemberScheduleApp,
  updateMemberScheduleAppMemo,
} = require("../controllers/schedule");

//시간표 관리
router.get("/", getSchedule);
router.get("/:id", getScheduleDetail);
router.get("/date/:id", getScheduleDetailByDate);
router.post("/memberScheduleApp", getMemberScheduleAppList);
router.post("/getReservationMemberList", getReservationMemberList);
router.post("/getRegisteredMemberList", getRegisteredMemberList);
router.patch("/updateMemberScheduleApp", updateMemberScheduleApp);
router.patch("/updateMemberScheduleAppMemo", updateMemberScheduleAppMemo);
router.post("/", createSchedule);
router.patch("/:id", updateSchedule);
router.delete("/:id", deleteSchedule);

module.exports = router;

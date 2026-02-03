const express = require("express");
const router = express.Router();
const {
  selectExerciseAppList,
  selectExerciseJumpingDetail,
  selectExerciseOtherDetail,
} = require("../../controllers/app/exerciseApp");

// 운동 목록 조회
router.post("/selectExerciseAppList", selectExerciseAppList);

// 운동 점핑 상세 조회
router.post("/selectExerciseJumpingDetail", selectExerciseJumpingDetail);

// 운동 기타 운동 상세 조회
router.post("/selectExerciseOtherDetail", selectExerciseOtherDetail);

module.exports = router;

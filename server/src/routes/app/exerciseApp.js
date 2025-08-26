const express = require("express");
const router = express.Router();
const {
  selectExerciseAppList,
} = require("../../controllers/app/exerciseApp");

// 운동 목록 조회
router.post("/selectExerciseAppList", selectExerciseAppList);

module.exports = router;

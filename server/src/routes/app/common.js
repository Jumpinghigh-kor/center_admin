const express = require("express");
const router = express.Router();
const {
  selectCommonCodeList,
  selectGroupCodeList,
  insertCommonCode,
  insertGroupCode,
  updateUseYn
} = require("../../controllers/app/common");

// 이벤트 목록 조회
router.post("/selectCommonCodeList", selectCommonCodeList);

// 그룹 코드 조회
router.post("/selectGroupCodeList", selectGroupCodeList);

// 공통 코드 등록
router.post("/insertCommonCode", insertCommonCode);

// 그룹 코드 등록
router.post("/insertGroupCode", insertGroupCode);

// 그룹 코드 사용 여부 수정
router.post("/updateUseYn", updateUseYn);

module.exports = router;

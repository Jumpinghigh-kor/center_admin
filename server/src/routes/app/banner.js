const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  selectBannerAppList,
  insertBannerApp,
  updateBannerApp,
  batchDeleteBannerApp,
} = require("../../controllers/app/banner");

// 메모리 스토리지 설정 (임시 저장)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
  fileFilter: (req, file, cb) => {
    // 파일 타입 체크 (png, jpg만 허용)
    if (
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(new Error("지원되지 않는 파일 형식입니다. (PNG, JPG만 가능)"), false);
    }
  },
});

// 배너 목록 조회
router.post("/selectBannerAppList", selectBannerAppList);

// 배너 등록 (파일 업로드 미들웨어 적용)
router.post("/insertBannerApp", upload.any(), insertBannerApp);

// 배너 수정 (파일 업로드 미들웨어 적용)
router.put("/updateBannerApp", upload.any(), updateBannerApp);

// 배너 일괄 삭제
router.post("/batchDeleteBannerApp", batchDeleteBannerApp);

module.exports = router;

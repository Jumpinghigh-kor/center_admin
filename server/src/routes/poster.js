const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  getPosterBaseList,
  getPosterDetail,
  createPosterBase,
  createPosterImage,
  createPosterText,
  uploadPosterImage,
  updatePosterBase,
  deletePosterBase,
  updatePosterImageUseYn,
  updatePosterText,
  updatePosterImage,
  updatePosterTextUseYn,
} = require("../controllers/poster");

// 메모리 스토리지 설정 (임시 저장)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 제한
  fileFilter: (req, file, cb) => {
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

router.get("/", getPosterBaseList);
router.get("/:posterId", getPosterDetail);
router.post("/createPosterBase", createPosterBase);
router.post("/createPosterImage", createPosterImage);
router.post("/createPosterText", createPosterText);
router.post("/uploadPosterImage", upload.any(), uploadPosterImage);
router.post("/updatePosterBase", updatePosterBase);
router.post("/updatePosterImage", updatePosterImage);
router.post("/updatePosterText", updatePosterText);
router.post("/deletePosterBase", deletePosterBase);
router.post("/updatePosterImageUseYn", updatePosterImageUseYn);
router.post("/updatePosterTextUseYn", updatePosterTextUseYn);

module.exports = router;

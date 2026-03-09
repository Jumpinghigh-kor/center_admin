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
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB 제한
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

router.post("/", getPosterBaseList);
router.get("/:posterId", getPosterDetail);
router.post("/createPosterBase", createPosterBase);
router.post("/createPosterImage", createPosterImage);
router.post("/createPosterText", createPosterText);
router.post("/uploadPosterImage", (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            error: '파일 크기가 너무 큽니다. 최대 100MB까지 업로드 가능합니다.',
            statusCode: '413'
          });
        }
        return res.status(400).json({
          error: `파일 업로드 오류: ${err.message}`,
          statusCode: '400'
        });
      }
      return res.status(400).json({
        error: err.message || '파일 업로드 오류',
        statusCode: '400'
      });
    }
    next();
  });
}, uploadPosterImage);
router.post("/updatePosterBase", updatePosterBase);
router.post("/updatePosterImage", updatePosterImage);
router.post("/updatePosterText", updatePosterText);
router.post("/deletePosterBase", deletePosterBase);
router.post("/updatePosterImageUseYn", updatePosterImageUseYn);
router.post("/updatePosterTextUseYn", updatePosterTextUseYn);

module.exports = router;

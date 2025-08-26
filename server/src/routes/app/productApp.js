const express = require("express");
const router = express.Router();
const {
  selectProductAppList,
  insertProductApp,
  updateProductApp,
  deleteProductApp,
  selectProductAppImgList,
  selectProductAppDetail,
  returnExchangePolicy,
} = require("../../controllers/app/productApp");
const multer = require("multer");

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

// 상품 목록 조회
router.post("/selectProductAppList", selectProductAppList);

// 상품 상세 목록 조회
router.post("/selectProductAppDetail", selectProductAppDetail);

// 상품 반품/교환 정책 조회
router.post("/returnExchangePolicy", returnExchangePolicy);

// 상품 등록
router.post("/insertProductApp", upload.any(), insertProductApp);

// 상품 수정
// router.post("/updateProductApp", upload.any(), updateProductApp);

// 상품 일괄 삭제
router.post("/deleteProductApp", deleteProductApp);

// 상품 이미지 목록 조히
router.post("/selectProductAppImgList", selectProductAppImgList);

module.exports = router;

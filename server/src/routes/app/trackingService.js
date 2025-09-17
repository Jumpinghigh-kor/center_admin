const express = require('express');
const router = express.Router();

// 배송 추적 정보 조회
router.post('/trackingService', async (req, res) => {
  try {
    const { companyName, trackingNumber } = req.body;
    
    if (!companyName || !trackingNumber) {
      return res.status(400).json({
        success: false,
        error: '택배사명과 운송장번호가 필요합니다.'
      });
    }
    // 컨트롤러의 getTrackingInfo 호출 (ESM/CJS 모두 대응)
    let getTrackingInfo;
    try {
      ({ getTrackingInfo } = await import('../../controllers/app/trackingService.js'));
    } catch (_) {
      try {
        ({ getTrackingInfo } = require('../../controllers/app/trackingService'));
      } catch (e) {
        // console.error('trackingService 컨트롤러 로드 실패:', e);
        return res.status(500).json({ success: false, error: '서버 설정 오류로 추적 기능을 사용할 수 없습니다.' });
      }
    }

    const result = await getTrackingInfo(companyName, trackingNumber);
    // 컨트롤러에서 표준 포맷으로 반환됨: { success, data | error }
    if (!(result && result.success)) {
      return res.status(200).json({
        success: false,
        error: (result && result.error) ? result.error : '조회 실패'
      });
    }
    return res.status(200).json(result);
  } catch (error) {
    // console.error('배송 추적 조회 에러:', error);
    res.status(500).json({
      success: false,
      error: '서버 오류가 발생했습니다.'
    });
  }
});

module.exports = router;

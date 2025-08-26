const axios = require('axios');
const db = require("../../../db");
const dayjs = require("dayjs");

const BASE_URL = 'https://api.iamport.kr';

if (!process.env.PORTONE_URL) {
  console.warn('[PortOne] PORTONE_URL is not set. Falling back to https://api.iamport.kr');
}

// 내부 유틸: 액세스 토큰 발급
const issuePortOneToken = async () => {
  const apiKey = process.env.PORTONE_API_KEY;
  const apiSecret = process.env.PORTONE_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('PORTONE_API_KEY or PORTONE_API_SECRET is not set');
  }

  const { data } = await axios.post(`${BASE_URL}/users/getToken`, {
    imp_key: apiKey,
    imp_secret: apiSecret,
  });

  const token = data?.response?.access_token;
  if (!token) {
    throw new Error('Failed to issue PortOne access token');
  }
  try {
    const masked = String(token).slice(0, 6) + '...' + String(token).slice(-4);
    console.log('[PortOne] Token issued:', masked);
  } catch (_) {}
  return token;
};

// 내부 유틸: 결제 취소 (부분/전체)
const requestPortOneRefundCore = async (imp_uid, merchant_uid, refundAmount, reason) => {
  console.log('requestPortOneRefundCore::::::', imp_uid, merchant_uid, refundAmount, reason);
  try {
    const token = await issuePortOneToken();
    const payload = {
      imp_uid,
      merchant_uid,
      reason,
    };
    if (typeof refundAmount === 'number') {
      payload.amount = refundAmount;
    }
    const result = await axios.post(
      `${BASE_URL}/payments/cancel`,
      payload,
      {
        headers: { Authorization: token },
      }
    );
    return result.data;
  } catch (e) {
    // 에러 응답을 그대로 전달해 디버깅에 도움
    const rsp = e?.response?.data || { message: e.message };
    console.error('[PortOne] Refund error:', rsp);
    return rsp;
  }
};

// Express 핸들러: 토큰 발급
const getPortOneToken = async (req, res) => {
  try {
    const token = await issuePortOneToken();
    console.log('[PortOne] /getPortOneToken success');
    res.status(200).json({ token });
  } catch (e) {
    const message = e?.response?.data || { message: e.message };
    console.error('[PortOne] /getPortOneToken error:', message);
    res.status(500).json(message);
  }
};

// Express 핸들러: 환불 요청
const requestPortOneRefund = async (req, res) => {
  try {
    const { imp_uid, merchant_uid, refundAmount, reason } = req.body || {};
    const result = await requestPortOneRefundCore(imp_uid, merchant_uid, refundAmount, reason);
    // 취소 성공 시 결제상태 업데이트
    try {
      const { payment_app_id, userId, order_app_id } = req.body || {};
      if (payment_app_id) {
        const mod_dt = dayjs().format('YYYYMMDDHHmmss');
        const updateQuery = `
          UPDATE member_payment_app SET
            payment_status = 'PAYMENT_REFUND'
            , portone_status = 'REFUND'
            , mod_dt = ?
            , mod_id = ?
          WHERE payment_app_id = ?
        `;
        db.query(updateQuery, [mod_dt, userId || null, payment_app_id], (err) => {
          if (err) {
            console.error('[PortOne] Update member_payment_app error:', err);
          }
        });
      }
      // 포인트 이력 del 처리
      if (order_app_id) {
        const updatePointQuery = `
          UPDATE member_point_app SET
            del_yn = 'Y'
            , mod_dt = ?
            , mod_id = ?
          WHERE order_app_id IN (?)
        `;
        db.query(updatePointQuery, [userId || null, order_app_id], (err) => {
          if (err) {
            console.error('[PortOne] Update member_point_app error:', err);
          }
        });
      }
    } catch (e) {
      console.error('[PortOne] Post-refund update error:', e);
    }
    res.status(200).json(result);
  } catch (e) {
    const message = e?.response?.data || { message: e.message };
    console.error('[PortOne] /requestPortOneRefund error:', message);
    res.status(500).json(message);
  }
};



module.exports = {
  getPortOneToken,
  requestPortOneRefund,
};
  

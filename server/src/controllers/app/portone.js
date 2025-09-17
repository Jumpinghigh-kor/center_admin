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

  const token = data.response.access_token;
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
    const rsp = e.response.data || { message: e.message };
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
    const message = e.response.data || { message: e.message };
    console.error('[PortOne] /getPortOneToken error:', message);
    res.status(500).json(message);
  }
};

// Express 핸들러: 환불 요청
const requestPortOneRefund = async (req, res) => {
  try {
    let { imp_uid, merchant_uid, refundAmount, reason, payment_app_id, order_app_id, userId } = req.body || {};

    // payment_app_id로 넘어오면 DB에서 식별자/금액 보강
    let paymentRow = null;
    if ((!imp_uid && !merchant_uid) || typeof refundAmount !== 'number') {
      if (payment_app_id) {
        try {
          const sql = `SELECT payment_app_id, payment_type, payment_amount, portone_imp_uid, portone_merchant_uid FROM member_payment_app WHERE payment_app_id = ? LIMIT 1`;
          await new Promise((resolve, reject) => {
            db.query(sql, [payment_app_id], (err, rows) => {
              if (err) return reject(err);
              paymentRow = rows && rows[0] ? rows[0] : null;
              resolve();
            });
          });
          if (paymentRow) {
            if (!imp_uid && paymentRow.portone_imp_uid) imp_uid = paymentRow.portone_imp_uid;
            if (!merchant_uid && paymentRow.portone_merchant_uid) merchant_uid = paymentRow.portone_merchant_uid;
            if (typeof refundAmount !== 'number') refundAmount = Number(paymentRow.payment_amount || 0);
          }
        } catch (lookupErr) {
          console.error('[PortOne] payment_app lookup error:', lookupErr);
        }
      }
    }

    const result = await requestPortOneRefundCore(imp_uid, merchant_uid, refundAmount, reason);
    // 취소 성공 시 결제상태 업데이트
    try {
      if (payment_app_id) {
        const mod_dt = dayjs().format('YYYYMMDDHHmmss');
        const updateQuery = `
          UPDATE member_payment_app SET
            payment_status = 'PAYMENT_REFUND'
            , portone_status = 'REFUND'
            , refund_amount = COALESCE(refund_amount, 0) + ?
            , mod_dt = ?
            , mod_id = ?
          WHERE payment_app_id = ?
        `;
        db.query(updateQuery, [Number(refundAmount || 0), mod_dt, userId || null, payment_app_id], (err) => {
          if (err) {
            console.error('[PortOne] Update member_payment_app error:', err);
          }
        });
      }
      // 배송비 결제(DELIVERY_FEE) 환불의 경우 포인트 이력 미변경
      // (product 환불 등 다른 케이스는 별도 처리에서 수행)
    } catch (e) {
      console.error('[PortOne] Post-refund update error:', e);
    }
    res.status(200).json(result);
  } catch (e) {
    const message = e.response.data || { message: e.message };
    console.error('[PortOne] /requestPortOneRefund error:', message);
    res.status(500).json(message);
  }
};



module.exports = {
  getPortOneToken,
  requestPortOneRefund,
};
  

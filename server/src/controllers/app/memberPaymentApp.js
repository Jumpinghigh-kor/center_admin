const db = require("../../../db");
const dayjs = require("dayjs");

// 결제 정보 수정
exports.updateMemberPaymentApp = (req, res) => {
  try {
    const { order_app_id, userId, payment_status, refund_amount } = req.body;

    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    const updateMemberPaymentAppQuery = `
      UPDATE member_payment_app SET
        payment_status = ?
        , refund_amount = COALESCE(refund_amount, 0) + ?
        , mod_dt = ?
        , mod_id = ?
      WHERE order_app_id = ?
    `;

    db.query(
      updateMemberPaymentAppQuery,
      [payment_status, refund_amount, mod_dt, userId, order_app_id],
      (err, result) => {
        if (err) {
          console.error("결제 정보 수정 오류:", err);
          return res
            .status(500)
            .json({ error: "결제 정보 수정 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "결제 정보 수정이 성공적으로 완료되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("결제 정보 수정 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};
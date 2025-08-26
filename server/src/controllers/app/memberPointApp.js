const db = require("../../../db");
const dayjs = require("dayjs");

// 포인트 삭제
exports.deleteMemberPointApp = (req, res) => {
  try {
    const { payment_app_id, userId } = req.body;

    // 현재 날짜 형식화
    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    // notices_app 테이블에 공지사항 정보 수정
    const updateMemberPointAppQuery = `
      UPDATE member_point_app SET
        del_yn = 'Y'
        , mod_dt = ?
        , mod_id = ?
      WHERE order_app_id = ?
    `;

    db.query(
      updateMemberPointAppQuery,
      [
        mod_dt,
        userId || null,
        payment_app_id,
      ],
      (err, result) => {
        if (err) {
          console.error("포인트 삭제 오류:", err);
          return res
            .status(500)
            .json({ error: "포인트 삭제 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "포인트가 성공적으로 삭제되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("포인트 삭제 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};
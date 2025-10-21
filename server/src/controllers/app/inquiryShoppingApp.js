const db = require("../../../db");
const dayjs = require("dayjs");

// 쇼핑몰 문의 목록 조회
exports.selectInquiryShoppingAppList = (req, res) => {
  const { center_id, memName, inquiryType, answerStatus } = req.body;
  
  let query = `
    SELECT
      m.mem_id
      , m.mem_name
      , isa.inquiry_shopping_app_id
      , isa.inquiry_type
      , isa.title
      , isa.content
      , isa.answer
      , DATE_FORMAT(isa.answer_dt, '%Y-%m-%d %H:%i:%s') AS answer_dt
      , DATE_FORMAT(isa.reg_dt, '%Y-%m-%d %H:%i:%s')    AS reg_dt
    FROM		    members m
    INNER JOIN	inquiry_shopping_app isa ON m.mem_id = isa.mem_id
    WHERE		    isa.del_yn = 'N'
    AND			    m.center_id = ?
  `;

  const params = [center_id];

  // 검색 조건 추가
  if (memName && memName !== '') {
    query += ` AND m.mem_name LIKE ?`;
    params.push(`%${memName}%`);
  }

  if (inquiryType && inquiryType !== '') {
    query += ` AND isa.inquiry_type = ?`;
    params.push(inquiryType);
  }

  if (answerStatus && answerStatus !== '') {
    if (answerStatus === 'Y') {
      query += ` AND isa.answer IS NOT NULL AND isa.answer != ''`;
    } else if (answerStatus === 'N') {
      query += ` AND (isa.answer IS NULL OR isa.answer = '')`;
    }
  }

  query += ` ORDER BY isa.inquiry_shopping_app_id DESC`;

  db.query(query, params, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 쇼핑몰 문의 대답
exports.updateInquiryShoppingApp = (req, res) => {
  try {
    const { inquiry_shopping_app_id, answer, userId } = req.body;

    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    const updateInquiryShoppingAppUpdateQuery = `
      UPDATE inquiry_shopping_app SET
        answer = ?
        , answer_dt = ?
        , mod_dt = ?
        , mod_id = ?
      WHERE inquiry_shopping_app_id = ?
    `;

    db.query(
      updateInquiryShoppingAppUpdateQuery,
      [answer, mod_dt, mod_dt, userId || null, inquiry_shopping_app_id],
      (err, result) => {
        if (err) {
          console.error("쇼핑몰 문의 수정 오류:", err);
          return res
            .status(500)
            .json({ error: "쇼핑몰 문의 수정 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "쇼핑몰 문의가 성공적으로 수정되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("쇼핑몰 문의 수정 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};
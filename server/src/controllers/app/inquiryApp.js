const db = require("../../../db");
const dayjs = require("dayjs");

// 문의 목록 조회
exports.selectInquiryAppList = (req, res) => {
  const { center_id, inquiry_type, mem_name, status, answer } = req.body;

  let addCondition = '';
  let params = [center_id, inquiry_type];

  if(mem_name) {
    addCondition += ` AND m.mem_name LIKE CONCAT('%', ?, '%')`;
    params.push(mem_name);
  }

  if(status) {
    addCondition += ` AND status = ?`;
    params.push(status);
  }

  if(answer == 'Y') {
    addCondition += ` AND ia.answer IS NOT NULL`;
  } else if(answer == 'N') {
    addCondition += ` AND ia.answer IS NULL`;
  }
  
  const query = `
    SELECT
      ia.inquiry_app_id
      , m.mem_id
      , m.mem_name
      , maa.account_app_id
      , CASE
          WHEN maa.status = 'ACTIVE' THEN '활동 회원'
          WHEN maa.status = 'PROCEED' THEN '가입 진행 중 회원'
          WHEN maa.status = 'EXIT' THEN '탈퇴 회원'
          ELSE '-'
        END AS status
      , ia.title
      , ia.content
      , DATE_FORMAT(ia.reg_dt, '%Y-%m-%d %H:%i:%s') AS reg_dt
      , ia.answer
      , DATE_FORMAT(ia.answer_dt, '%Y-%m-%d %H:%i:%s') AS answer_dt
    FROM		    members m
    INNER JOIN  member_account_app maa  ON m.mem_id = maa.mem_id
    INNER JOIN	inquiry_app ia          ON maa.account_app_id = ia.account_app_id
    WHERE		    ia.del_yn = 'N'
    AND			    m.center_id = ?
    AND			    ia.inquiry_type = ?
    ${addCondition}
    ORDER BY	  ia.inquiry_app_id DESC
  `;

  db.query(query, params, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 문의 대답
exports.updateInquiryApp = (req, res) => {
  try {
    const { inquiry_app_id, answer, userId } = req.body;

    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    const updateInquiryAppUpdateQuery = `
      UPDATE inquiry_app SET
        answer = ?
        , answer_dt = ?
        , mod_dt = ?
        , mod_id = ?
      WHERE inquiry_app_id = ?
    `;

    db.query(
      updateInquiryAppUpdateQuery,
      [answer, mod_dt, mod_dt, userId || null, inquiry_app_id],
      (err, result) => {
        if (err) {
          console.error("문의 수정 오류:", err);
          return res
            .status(500)
            .json({ error: "문의 수정 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "문의가 성공적으로 수정되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("문의 수정 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};
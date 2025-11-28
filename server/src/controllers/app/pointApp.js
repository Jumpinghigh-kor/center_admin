const db = require("../../../db");
const dayjs = require("dayjs");

// 포인트 목록 조회
exports.selectPointAppList = (req, res) => {
  const { mem_name, point_type, center_id, point_amount_min, point_amount_max } = req.body;

  let addCondition = '';
  let params = [];

  if(mem_name) {
    addCondition += `AND m.mem_name LIKE CONCAT('%', ?, '%')`;
    params.push(mem_name);
  }

  if(point_type) {
    addCondition += `AND mpa.point_type = ?`;
    params.push(point_type);
  }

  if(center_id) {
    addCondition += `AND m.center_id = ?`;
    params.push(center_id);
  }

  if(point_amount_min) {
    addCondition += `AND mpa.point_amount >= ?`;
    params.push(point_amount_min);
  }

  if(point_amount_max) {
    addCondition += `AND mpa.point_amount <= ?`;
    params.push(point_amount_max);
  }

  const query = `
    SELECT
      m.mem_id
      , m.mem_name
      , CASE
        WHEN	m.mem_app_status = 'ACTIVE' THEN '활동회원'
        ELSE 	'탈퇴회원'
      END AS mem_app_status
      , (
          SELECT
            scc.common_code_name
          FROM	common_code scc
          WHERE	scc.common_code = mpa.point_type
        ) AS point_type
      , mpa.point_app_id
      , mpa.order_detail_app_id
      , CASE
          WHEN	mpa.point_status = 'POINT_ADD' THEN '획득'
          ELSE	'차감'
      END	AS point_status
      , mpa.point_amount
      , mpa.point_memo
      , DATE_FORMAT(mpa.reg_dt, '%Y-%m-%d %H:%i:%s') AS reg_dt
      , (
          SELECT
            smoda.order_status
          FROM	member_order_detail_app smoda
          WHERE	smoda.order_detail_app_id = mpa.order_detail_app_id
        ) AS order_status
      , (
			    SELECT
				    sc.center_name
			    FROM	centers sc
          WHERE	sc.center_id = m.center_id
        ) AS center_name
    FROM		    members m
    INNER JOIN	member_point_app mpa ON m.mem_id = mpa.mem_id
    WHERE		    mpa.del_yn = 'N'
    ${addCondition}
    ORDER BY	  mpa.point_app_id DESC
  `;

  db.query(query, [...params], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 포인트 등록
exports.insertPointApp = (req, res) => {
  const { point_type, point_status, point_amount, point_memo, userId } = req.body;

  const now = dayjs();
  const reg_dt = now.format("YYYYMMDDHHmmss");

  const pointAppInsertQuery = `
    INSERT INTO member_point_app (
      mem_id
      , order_detail_app_id
      , point_type
      , point_status
      , point_amount
      , point_memo
      , del_yn
      , reg_dt
      , reg_id
      , mod_dt
      , mod_id
    ) VALUES (
      ?
      , ?
      , ?
      , ?
      , ?
      , ?
      , ?
      , ?
      , ?
      , ?
      , ?
    )
  `;

  db.query(pointAppInsertQuery, [userId, null, point_type, point_status, point_amount, point_memo, 'N', reg_dt, userId, null, null], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 포인트 수정
exports.updatePointApp = (req, res) => {
  try {
    const { point_app_id, point_amount, point_memo, userId } = req.body;

    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    const pointAppUpdateQuery = `
      UPDATE member_point_app SET
        point_amount = ?
        , point_memo = ?
        , mod_dt = ?
        , mod_id = ?
      WHERE point_app_id = ?
    `;

    db.query(
      pointAppUpdateQuery,
      [point_amount, point_memo, mod_dt, userId, point_app_id],
      async (pointAppErr, pointAppResult) => {
        if (pointAppErr) {
          console.error("포인트 수정 오류:", pointAppErr);
          return res
            .status(500)
            .json({ error: "포인트 수정 중 오류가 발생했습니다." });
        }

        // 등록 성공 후 푸시 발송 (옵션)
          res.status(200).json({
          message: "포인트가 성공적으로 수정되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("포인트 수정 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 포인트 삭제
exports.deletePointApp = (req, res) => {
  try {
    const { point_app_id, userId } = req.body;

    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    const deletePointAppQuery = `
      UPDATE member_point_app SET
        del_yn = 'Y'
        , mod_dt = ?
        , mod_id = ?
      WHERE point_app_id IN (?)
    `;

    db.query(
      deletePointAppQuery,
      [mod_dt, userId, point_app_id],
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
const db = require("../../../db");
const dayjs = require("dayjs");
const { sendPush } = require("../../utils/push");

// 우편함 목록 조회
exports.selectPostAppList = (req, res) => {
  const { } = req.body;

  let addCondition = '';

  if(mem_name) {
    addCondition += ` AND m.mem_name LIKE CONCAT('%', ?, '%')`;
    params.push(mem_name);
  }

  if(mem_app_status) {
    addCondition += ` AND m.mem_app_status = ?`;
    params.push(mem_app_status);
  }

  if(answer == 'Y') {
    addCondition += ` AND ia.answer IS NOT NULL`;
  } else if(answer == 'N') {
    addCondition += ` AND ia.answer IS NULL`;
  }
  
  const query = `
      SELECT
        p.post_app_id
        , p.post_type
        , p.title
        , p.content
        , p.all_send_yn
        , DATE_FORMAT(p.reg_dt, '%Y-%m-%d %H:%i:%s') AS reg_dt
        , mpa.read_yn
        , mpa.read_dt
        , m.mem_id
        , m.mem_name
        , m.mem_phone
        , m.mem_app_status
        , m.push_yn
      FROM		  post_app p
      LEFT JOIN	member_post_app mpa	ON 	p.post_app_id = mpa.post_app_id
      LEFT JOIN	members m			ON	mpa.mem_id = m.mem_id
      WHERE		  p.del_yn = 'N'
      ${addCondition}
      ORDER BY	p.post_app_id DESC
  `;

  db.query(query, (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 우편함 등록
exports.insertPostApp = (req, res) => {
  try {
    const { post_type, title, content, all_send_yn, userId } = req.body;

    // 현재 날짜 형식화
    const now = dayjs();
    const reg_dt = now.format("YYYYMMDDHHmmss");

    // post_app 테이블에 우편함 정보 등록
    const postAppInsertQuery = `
      INSERT INTO post_app (
        post_type
        , title
        , content
        , all_send_yn
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
        , 'N'
        , ?
        , ?
        , NULL
        , NULL
      )
    `;

    db.query(
      postAppInsertQuery,
      [post_type, title, content, all_send_yn, reg_dt, userId || null, null, null],
      (postAppErr, postAppResult) => {
        if (postAppErr) {
          console.error("우편함 등록 오류:", postAppErr);
          return res
            .status(500)
            .json({ error: "우편함 등록 중 오류가 발생했습니다." });
        }

        res.status(201).json({
          postAppId: postAppResult.insertId,
          message: "우편함이 성공적으로 등록되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("우편함 등록 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 우편함 등록
exports.insertMemberPostApp = (req, res) => {
  try {
    const { post_app_id, mem_id, read_yn, read_dt, userId } = req.body;

    // 현재 날짜 형식화
    const now = dayjs();
    const reg_dt = now.format("YYYYMMDDHHmmss");

    // member_post_app 테이블에 우편함 정보 등록
    const memberPostAppInsertQuery = `
      INSERT INTO member_post_app (
        post_app_id
        , mem_id
        , read_yn
        , read_dt
        , del_yn
        , reg_dt
        , reg_id
        , mod_dt
        , mod_id
      ) VALUES (
        ?
        , ?
        , 'N'
        , NULL
        , 'N'
        , ?
        , ?
        , NULL
        , NULL
      )
    `;

    db.query(
      memberPostAppInsertQuery,
      [post_app_id, mem_id, reg_dt, userId],
      (memberPostAppErr, memberPostAppResult) => {
        if (memberPostAppErr) {
          console.error("우편함 등록 오류:", memberPostAppErr);
          return res
            .status(500)
            .json({ error: "우편함 등록 중 오류가 발생했습니다." });
        }

        res.status(201).json({
          memberPostAppId: memberPostAppResult.insertId,
          message: "우편함이 성공적으로 등록되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("우편함 등록 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 우편함 삭제
exports.deletePostApp = (req, res) => {
  try {
    const { post_app_id, userId } = req.body;

    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    const deletePostAppQuery = `
      UPDATE post_app SET
        del_yn = 'Y'
        , mod_dt = ?
        , mod_id = ?
      WHERE post_app_id = ?
    `;

    db.query(
      deletePostAppQuery,
      [mod_dt, userId, post_app_id],
      (err, result) => {
        if (err) {
          console.error("우편함 삭제 오류:", err);
          return res
            .status(500)
            .json({ error: "우편함 삭제 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "우편함이 성공적으로 삭제되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("우편함 삭제 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 회원 우편함 삭제
exports.deleteMemberPostApp = (req, res) => {
  try {
    const { member_post_app_id, userId } = req.body;

    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    const deleteMemberPostAppQuery = `
      UPDATE member_post_app SET
        del_yn = 'Y'
        , mod_dt = ?
        , mod_id = ?
      WHERE member_post_app_id = ?
    `;

    db.query(
      deleteMemberPostAppQuery,
      [mod_dt, userId, member_post_app_id],
      (err, result) => {
        if (err) {
          console.error("회원 우편함 삭제 오류:", err);
          return res
            .status(500)
            .json({ error: "회원 우편함 삭제 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "회원 우편함이 성공적으로 삭제되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("회원 우편함 삭제 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 테스트용 푸시 발송 훅 (라우터 연결 없이 컨트롤러만 제공)
exports.testSendPostPush = async (req, res) => {
  try {
    const { title, body, center_id, mem_ids } = req.body || {};

    let where = "WHERE m.push_yn = 'Y' AND m.push_token IS NOT NULL";
    const params = [];

    if (center_id) {
      where += " AND m.center_id = ?";
      params.push(center_id);
    }

    if (Array.isArray(mem_ids) && mem_ids.length > 0) {
      const placeholders = mem_ids.map(() => "?").join(",");
      where += ` AND m.mem_id IN (${placeholders})`;
      params.push(...mem_ids);
    }

    const tokenQuery = `
      SELECT m.push_token
      FROM members m
      ${where}
    `;

    db.query(tokenQuery, params, async (err, rows) => {
      if (err) {
        console.error("푸시 대상 조회 오류:", err);
        return res.status(500).json({ message: "대상 조회 실패", error: err });
      }

      const tokens = rows.map(r => r.push_token).filter(Boolean);
      if (!tokens.length) {
        return res.status(200).json({ message: "발송 대상 없음", successCount: 0, failureCount: 0 });
      }

      const result = await sendPush(tokens, {
        title: title || "테스트 알림",
        body: body || "테스트 메시지입니다.",
        data: { type: "POST_APP_TEST" },
      });

      return res.status(200).json({
        message: "푸시 발송 완료",
        tokens: tokens.length,
        successCount: result.successCount,
        failureCount: result.failureCount,
      });
    });
  } catch (e) {
    console.error("테스트 푸시 발송 오류:", e);
    return res.status(500).json({ message: "서버 오류", error: e?.message || e });
  }
};
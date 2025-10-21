const db = require("../../../db");
const dayjs = require("dayjs");
const { sendPush } = require("../../utils/push");

// 우편함 목록 조회
exports.selectPostAppList = (req, res) => {
  const { title, post_type, all_send_yn, push_send_yn } = req.body;

  let addCondition = '';
  let params = [];

  if(title) {
    addCondition += ` AND p.title LIKE CONCAT('%', ?, '%')`;
    params.push(title);
  }

  if(post_type) {
    addCondition += ` AND p.post_type = ?`;
    params.push(post_type);
  }

  if(all_send_yn) {
    addCondition += ` AND p.all_send_yn = ?`;
    params.push(all_send_yn);
  }

  if(push_send_yn) {
    addCondition += ` AND p.push_send_yn = ?`;
    params.push(push_send_yn);
  }
  
  const query = `
      SELECT
        p.post_app_id
        , p.post_type
        , p.title
        , p.content
        , p.all_send_yn
        , p.push_send_yn
        , DATE_FORMAT(p.reg_dt, '%Y-%m-%d %H:%i:%s') AS reg_dt
      FROM		  post_app p
      WHERE		  p.del_yn = 'N'
      ${addCondition}
      ORDER BY	p.post_app_id DESC
  `;

  db.query(query, params, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 우편함 회원 목록 조회
exports.selectMemberPostAppList = (req, res) => {
  const { post_app_id } = req.body;

  const query = `
      SELECT
        p.post_app_id
        , p.post_type
        , p.title
        , p.content
        , p.all_send_yn
        , p.push_send_yn
        , m.mem_id
        , m.mem_name
        , mpa.member_post_app_id
      FROM		  	post_app p
      LEFT JOIN		member_post_app mpa	ON 	p.post_app_id = mpa.post_app_id
      LEFT JOIN		members m 			    ON	mpa.mem_id = m.mem_id
      WHERE		  	  p.post_app_id = ?
  `;

  db.query(query, [post_app_id], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 우편함 등록
exports.insertPostApp = (req, res) => {
  try {
    const { post_type, title, content, all_send_yn, userId, push_send_yn, mem_id } = req.body;
    
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
        , push_send_yn
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
        , 'N'
        , ?
        , ?
        , NULL
        , NULL
      )
    `;

    db.query(
      postAppInsertQuery,
      [post_type, title, content, all_send_yn, push_send_yn, reg_dt, userId || null, null, null],
      async (postAppErr, postAppResult) => {
        if (postAppErr) {
          console.error("우편함 등록 오류:", postAppErr);
          return res
            .status(500)
            .json({ error: "우편함 등록 중 오류가 발생했습니다." });
        }

        // 등록 성공 후 푸시 발송 (옵션)
        if (push_send_yn === 'Y') {
          try {
            let tokenWhere = "WHERE m.push_yn = 'Y' AND m.push_token IS NOT NULL";
            const params = [];

            if (all_send_yn === 'N' && mem_id) {
              const ids = String(mem_id)
                .split(',')
                .map((s) => s.trim())
                .filter((s) => s)
                .map((s) => Number(s))
                .filter((n) => !Number.isNaN(n));
              if (ids.length) {
                tokenWhere += ` AND m.mem_id IN (${ids.map(() => '?').join(',')})`;
                params.push(...ids);
              }
            }

            const tokenQuery = `
              SELECT m.push_token
              FROM members m
              ${tokenWhere}
            `;

            const tokens = await new Promise((resolve, reject) => {
              db.query(tokenQuery, params, (err, rows) => {
                if (err) return reject(err);
                resolve(rows.map((r) => r.push_token).filter(Boolean));
              });
            });

            if (Array.isArray(tokens) && tokens.length) {
              await sendPush(tokens, {
                title: title || '알림',
                body: content || '',
                data: { type: 'POST_APP', post_type: post_type || '' },
              });
            }
          } catch (pushErr) {
            console.error('푸시 발송 오류:', pushErr);
          }
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

// 회원 우편함 등록
exports.insertMemberPostApp = (req, res) => {
  try {
    const { post_app_id, mem_id, userId } = req.body;

    const now = dayjs();
    const reg_dt = now.format("YYYYMMDDHHmmss");

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
      WHERE post_app_id IN (?)
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
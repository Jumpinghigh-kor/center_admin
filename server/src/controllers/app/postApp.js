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
        , maa.account_app_id
        , m.mem_name
        , mpa.member_post_app_id
      FROM		  	post_app p
      LEFT JOIN		member_post_app mpa	    ON 	p.post_app_id = mpa.post_app_id
      LEFT JOIN		member_account_app maa	ON	mpa.account_app_id = maa.account_app_id
      LEFT JOIN		members m 			        ON	maa.mem_id = m.mem_id
      WHERE		  	p.post_app_id = ?
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
    const { post_type, title, content, all_send_yn, userId, push_send_yn, memberList } = req.body;
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
        , ?
        , ?
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
            let tokenWhere = "WHERE maa.push_yn = 'Y' AND maa.push_token IS NOT NULL";
            const params = [];

            if (all_send_yn === 'N' && memberList && memberList.length > 0) {
                tokenWhere += ` AND maa.account_app_id IN (${memberList.map(() => '?').join(',')})`;
                params.push(...memberList);
            }

            const tokenQuery = `
              SELECT
                maa.push_token
                , maa.account_app_id
              FROM member_account_app maa
              ${tokenWhere}
            `;

            const tokenRows = await new Promise((resolve, reject) => {
              db.query(tokenQuery, params, (err, rows) => {
                if (err) return reject(err);
                resolve(rows.filter((r) => r.push_token));
              });
            });

            if (Array.isArray(tokenRows) && tokenRows.length) {
              const tokens = tokenRows.map((r) => r.push_token);
              const tokenToAccountIdMap = new Map(
                tokenRows.map((r) => [r.push_token, r.account_app_id])
              );

              const pushResult = await sendPush(tokens, {
                title: title || '알림',
                body: content || '',
                data: { type: 'POST_APP', post_type: post_type || '' },
              });

              // 무효한 토큰을 DB에서 제거
              if (pushResult.invalidTokens && pushResult.invalidTokens.length > 0) {
                const invalidAccountIds = pushResult.invalidTokens
                  .map((token) => tokenToAccountIdMap.get(token))
                  .filter(Boolean);

                if (invalidAccountIds.length > 0) {
                  const updateQuery = `
                    UPDATE member_account_app 
                    SET push_token = NULL 
                    WHERE account_app_id IN (${invalidAccountIds.map(() => '?').join(',')})
                  `;
                  db.query(updateQuery, invalidAccountIds, (updateErr) => {
                    if (updateErr) {
                      console.error('무효한 토큰 제거 오류:', updateErr);
                    } else {
                      console.log(`[Push] ${invalidAccountIds.length}개의 무효한 토큰이 DB에서 제거되었습니다.`);
                    }
                  });
                }
              }
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
    const { post_app_id, account_app_id, userId } = req.body;
    
    const now = dayjs();
    const reg_dt = now.format("YYYYMMDDHHmmss");

    const memberPostAppInsertQuery = `
      INSERT INTO member_post_app (
        post_app_id
        , account_app_id
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
      [post_app_id, account_app_id, reg_dt, userId],
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
const db = require("../../../db");
const dayjs = require("dayjs");
const bcrypt = require("bcrypt");

// 어플 회원 목록 조회
exports.selectMemberAppList = (req, res) => {
    const { mem_name, center_id, status, mem_gender, start_app_reg_dt, end_app_reg_dt, start_recent_dt, end_recent_dt, is_reservation } = req.body;

    let addCondition = '';
    let params = [];
  
    let formatDate = (date) => {
      return date.replace(/-/g, '');
    }

    if(status) {
      if(status === 'NON_MEMBER') {
        addCondition += ` AND maa.status IS NULL`;
      } else {
        addCondition += ` AND maa.status = ?`;
        params.push(status);
      }
    }

    if(center_id) {
      addCondition += ` AND c.center_id = ?`;
      params.push(center_id);
    }

    if(mem_name) {
      addCondition += ` AND m.mem_name LIKE CONCAT('%', ?, '%')`;
      params.push(mem_name);
    }

    if(mem_gender) {
      addCondition += ` AND m.mem_gender = ?`;
      params.push(mem_gender);
    }

    if(start_app_reg_dt && end_app_reg_dt) {
      addCondition += ` AND DATE_FORMAT(maa.reg_dt, '%Y%m%d') BETWEEN ? AND ?`;
      params.push(formatDate(start_app_reg_dt), formatDate(end_app_reg_dt));
    } else if(start_app_reg_dt) {
      addCondition += ` AND DATE_FORMAT(maa.reg_dt, '%Y%m%d') >= ?`;
      params.push(formatDate(start_app_reg_dt));
    } else if(end_app_reg_dt) {
      addCondition += ` AND DATE_FORMAT(maa.reg_dt, '%Y%m%d') <= ?`;
      params.push(formatDate(end_app_reg_dt));
    }

    if(start_recent_dt && end_recent_dt) {
      addCondition += ` AND DATE_FORMAT(maa.recent_dt, '%Y%m%d') BETWEEN ? AND ?`;
      params.push(formatDate(start_recent_dt), formatDate(end_recent_dt));
    } else if(start_recent_dt) {
      addCondition += ` AND DATE_FORMAT(maa.recent_dt, '%Y%m%d') >= ?`;
      params.push(formatDate(start_recent_dt));
    } else if(end_recent_dt) {
      addCondition += ` AND DATE_FORMAT(maa.recent_dt, '%Y%m%d') <= ?`;
      params.push(formatDate(end_recent_dt));
    }

    if(is_reservation) {
      addCondition += `                      
                        AND 0 < (
                                  SELECT
                                    COUNT(*)
                                  FROM      member_orders smo
                                  LEFT JOIN products sp  ON smo.memo_pro_id = sp.pro_id
                                  WHERE     smo.memo_mem_id = m.mem_id
                                  AND       (DATE_FORMAT(smo.memo_start_date, '%Y%m%d000001') <= DATE_FORMAT(NOW(), '%Y%m%d%H%m%s')
                                            AND DATE_FORMAT(NOW(), '%Y%m%d%H%m%s') <= DATE_FORMAT(smo.memo_end_date, '%Y%m%d235959'))
                                  AND       (sp.pro_type    != '회차권' 
                                            OR (sp.pro_type = '회차권' AND smo.memo_remaining_counts > 0))
                                )`;
    }

    const query = `
      SELECT
        c.center_id
        , c.center_name
        , m.mem_id
        , m.mem_name
        , m.mem_phone
        , m.mem_sch_id
        , CASE
        WHEN m.mem_gender = 0 THEN '여자'
        ELSE '남자'
        END AS mem_gender
        , maa.account_app_id
        , maa.login_id
        , maa.status
        , maa.mem_role
        , DATE_FORMAT(maa.recent_dt, '%Y-%m-%d %H:%i:%s') AS recent_dt
        , DATE_FORMAT(maa.reg_dt, '%Y-%m-%d %H:%i:%s') AS reg_dt
        , DATE_FORMAT(maa.exit_dt, '%Y-%m-%d %H:%i:%s') AS exit_dt
        , (
            SELECT
              sch_time
            FROM	schedule s
            WHERE	s.sch_id = m.mem_sch_id
        ) AS sch_time
        , (
            SELECT 
              COALESCE(SUM(
                  CASE 
                      WHEN smpa.point_status = 'POINT_ADD' THEN smpa.point_amount
                      WHEN smpa.point_status = 'POINT_MINUS' THEN -smpa.point_amount
                      ELSE 0
                  END
              ), 0)
            FROM  member_point_app smpa
            WHERE smpa.account_app_id = maa.account_app_id
            AND   smpa.del_yn = 'N'
          ) AS point_amount
      FROM		    centers c
      LEFT JOIN	  members m               ON c.center_id = m.center_id
      LEFT JOIN   member_account_app maa  ON (m.mem_id = maa.mem_id AND         (maa.del_yn = 'N' OR maa.del_yn IS NULL))
      WHERE		    m.mem_status = 1
      ${addCondition}
      ORDER BY	  c.center_id, mem_name DESC
    `;
    
    db.query(query, [...params], (err, result) => {
      if (err) {
        return res.status(500).json(err);
      }
      res.status(200).json({ result: result });
    });
  };

  
//회원 앱 계정 생성
exports.createMemberApp = async (req, res) => {
  const {
    mem_id,
    login_id,
    password,
    mem_role
  } = req.body;

  try {
    const checkDuplicateQuery = 
      `
        SELECT
          COUNT(*) AS cnt
        FROM        members m
        INNER JOIN  member_account_app maa ON m.mem_id = maa.mem_id
        WHERE       mem_status = 1
        AND         maa.login_id = ?
        AND         maa.del_yn = 'N'
      `;

    db.query(
      checkDuplicateQuery,
      [String(login_id || '').trim()],
      async (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).json(err);
        }

        if (result[0].cnt > 0) {
          return res.status(400).json({
            message:
              "동일한 아이디가 존재합니다. 아이디를 변경하시기 바랍니다.",
            result: result,
          });
        }

        try {
          // 비밀번호 해시화
          const saltRounds = 10;
          const hashedPassword = await bcrypt.hash(password, saltRounds);

          const query = 
            `
              INSERT INTO member_account_app (
                mem_id
                , nickname
                , login_id
                , password
                , status
                , mem_role
                , push_yn
                , push_token
                , recent_dt
                , active_dt
                , exit_dt
                , del_yn
                , reg_dt
                , reg_id
                , mod_dt
                , mod_id
              ) VALUES (
                ?
                , null
                , ?
                , ?
                , 'PROCEED'
                , ?
                , null
                , null
                , null
                , null
                , null
                , 'N'
                , DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')
                , ?
                , null
                , null
              )
            `;
          db.query(
            query,
            [
              mem_id,
              login_id,
              hashedPassword,
              mem_role,
              mem_id,
            ],
            (err, result) => {
              if (err) {
                console.log(err);
                return res.status(500).json(err);
              }
              res.status(201).json({
                message: "어플 계정이 생성되었습니다.",
                result: result,
              });
            }
          );
        } catch (hashError) {
          console.log("Password hashing error:", hashError);
          return res.status(500).json({
            message: "비밀번호 암호화 중 오류가 발생했습니다.",
            error: hashError,
          });
        }
      }
    );
  } catch (error) {
    console.log("General error:", error);
    return res.status(500).json({
      message: "서버 오류가 발생했습니다.",
      error: error,
    });
  }
};

// 어플 회원 정보 수정
exports.updateMemberAppInfo = (req, res) => {
  try {
    const { userId, login_id, mem_role, account_app_id } = req.body;

    // 현재 날짜 형식화
    const now = dayjs();
    const app_mod_dt = now.format("YYYYMMDDHHmmss");

    // 아이디 중복 체크 (본인 제외)
    const checkDuplicateQuery = `
      SELECT
        COUNT(*) AS cnt
      FROM        members m
      INNER JOIN  member_account_app maa ON m.mem_id = maa.mem_id
      WHERE       m.mem_status = 1
      AND         maa.login_id = ?
      AND         maa.account_app_id <> ?
      AND         maa.del_yn = 'N'
    `;

    db.query(
      checkDuplicateQuery,
      [String(login_id || "").trim(), account_app_id],
      (dupErr, dupRows) => {
        if (dupErr) {
          console.error("어플 회원 정보 수정(중복체크) 오류:", dupErr);
          return res.status(500).json({ error: "어플 회원 정보 수정 중 오류가 발생했습니다." });
        }
        if (dupRows && dupRows[0] && Number(dupRows[0].cnt) > 0) {
          return res.status(400).json({
            message: "동일한 아이디가 존재합니다. 아이디를 변경하시기 바랍니다.",
          });
        }

        // members 테이블에 어플 회원 정보 수정
        const memberUpdateQuery = `
          UPDATE member_account_app SET
            login_id = ?
            , mem_role = ?
            , mod_dt = ?
            , mod_id = ?
          WHERE account_app_id = ?
        `;

        db.query(
          memberUpdateQuery,
          [
            String(login_id || "").trim(),
            mem_role,
            app_mod_dt,
            userId,
            account_app_id,
          ],
          (err, result) => {
            if (err) {
              console.error("어플 회원 정보 수정 오류:", err);
              return res
                .status(500)
                .json({ error: "어플 회원 정보 수정 중 오류가 발생했습니다." });
            }

            res.status(200).json({
              message: "어플 회원 정보가 성공적으로 수정되었습니다.",
            });
          }
        );
      }
    );
  } catch (error) {
    console.error("어플 회원 정보 수정 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 어플 회원 비밀번호 수정
exports.updateMemberAppPassword = (req, res) => {
  try {
    const { userId, password, account_app_id } = req.body;

    // 현재 날짜 형식화
    const now = dayjs();
    const app_mod_dt = now.format("YYYYMMDDHHmmss");

    // 비밀번호 해시화
    const bcrypt = require("bcrypt");
    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(password, saltRounds);

    // members 테이블에 어플 회원 비밀번호 정보 수정
    const memberUpdateQuery = `
      UPDATE member_account_app SET
        password = ?
        , mod_dt = ?
        , mod_id = ?
      WHERE account_app_id = ?
    `;

    db.query(
      memberUpdateQuery,
      [
        hashedPassword,
        app_mod_dt,
        userId,
        account_app_id,
      ],
      (err, result) => {
        if (err) {
          console.error("어플 회원 비밀번호 수정 오류:", err);
          return res
            .status(500)
            .json({ error: "어플 회원 비밀번호 수정 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "어플 회원 비밀번호가 성공적으로 수정되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("어플 회원 비밀번호 수정 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 회원 앱 상태 활성화 (탈퇴 해제)
exports.updateMemberActive = (req, res) => {
  try {
    const { mem_id, account_app_id } = req.body;

    // 현재 날짜 형식화
    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    const query = `
      UPDATE member_account_app SET
        status = 'ACTIVE'
        , exit_dt = NULL
        , mod_dt = ?
        , mod_id = ?
      WHERE account_app_id = ?
    `;

    db.query(
      query,
      [mod_dt, mem_id, account_app_id],
      (err, result) => {
        if (err) {
          console.error("회원 활성화 오류:", err);
          return res.status(500).json({ error: "회원 활성화 중 오류가 발생했습니다." });
        }
        return res.status(200).json({
          message: "회원 상태가 활동회원으로 변경되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("회원 활성화 처리 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 회원 앱 삭제
exports.deleteMemberApp = (req, res) => {
  try {
    const { mem_id, account_app_id } = req.body;
    
    // 현재 날짜 형식화
    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    const query = `
      UPDATE member_account_app SET
        del_yn = 'Y'
        , mod_dt = ?
        , mod_id = ?
      WHERE account_app_id = ?
    `;

    db.query(
      query,
      [mod_dt, mem_id, account_app_id],
      (err, result) => {
        if (err) {
          console.error("회원 삭제 오류:", err);
          return res.status(500).json({ error: "회원 삭제 중 오류가 발생했습니다." });
        }
      }
    );
  } catch (error) {
    console.error("회원 활성화 처리 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

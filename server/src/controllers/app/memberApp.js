const db = require("../../../db");
const dayjs = require("dayjs");
const bcrypt = require("bcrypt");

// 어플 회원 목록 조회
exports.selectMemberAppList = (req, res) => {
    const { mem_name, center_id, mem_app_status, mem_gender, start_app_reg_dt, end_app_reg_dt, start_recent_dt, end_recent_dt, is_reservation } = req.body;

    let addCondition = '';
    let params = [];
  
    let formatDate = (date) => {
      return date.replace(/-/g, '');
    }

    if(mem_app_status) {
      if(mem_app_status === 'NON_MEMBER') {
        addCondition += ` AND m.mem_app_status IS NULL`;
      } else {
        addCondition += ` AND m.mem_app_status = ?`;
        params.push(mem_app_status);
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
      addCondition += ` AND DATE_FORMAT(m.app_reg_dt, '%Y%m%d') BETWEEN ? AND ?`;
      params.push(formatDate(start_app_reg_dt), formatDate(end_app_reg_dt));
    } else if(start_app_reg_dt) {
      addCondition += ` AND DATE_FORMAT(m.app_reg_dt, '%Y%m%d') >= ?`;
      params.push(formatDate(start_app_reg_dt));
    } else if(end_app_reg_dt) {
      addCondition += ` AND DATE_FORMAT(m.app_reg_dt, '%Y%m%d') <= ?`;
      params.push(formatDate(end_app_reg_dt));
    }

    if(start_recent_dt && end_recent_dt) {
      addCondition += ` AND DATE_FORMAT(m.recent_dt, '%Y%m%d') BETWEEN ? AND ?`;
      params.push(formatDate(start_recent_dt), formatDate(end_recent_dt));
    } else if(start_recent_dt) {
      addCondition += ` AND DATE_FORMAT(m.recent_dt, '%Y%m%d') >= ?`;
      params.push(formatDate(start_recent_dt));
    } else if(end_recent_dt) {
      addCondition += ` AND DATE_FORMAT(m.recent_dt, '%Y%m%d') <= ?`;
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
        , m.mem_email_id
        , m.mem_role
        , CASE
            WHEN m.mem_gender = 0 THEN '여자'
            ELSE '남자'
        END AS mem_gender
        , m.mem_app_status
        , (
            SELECT
              sch_time
            FROM	schedule s
            WHERE	s.sch_id = m.mem_sch_id
        ) AS sch_time
        , m.mem_sch_id
        , DATE_FORMAT(m.recent_dt, '%Y-%m-%d %H:%i:%s') AS recent_dt
        , DATE_FORMAT(m.app_reg_dt, '%Y-%m-%d %H:%i:%s') AS app_reg_dt
      FROM		  centers c
      LEFT JOIN	members m ON c.center_id = m.center_id
      WHERE		  m.mem_status = 1
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
    mem_email_id,
    mem_app_password,
    mem_role,
  } = req.body;

  try {
    const checkDuplicateQuery = 
      `
        SELECT
          COUNT(*)
        FROM  members
        WHERE mem_status = 1
        AND   mem_email_id = ?
      `;

    db.query(
      checkDuplicateQuery,
      [mem_email_id],
      async (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).json(err);
        }

        if (result[0].count > 0) {
          return res.status(400).json({
            message:
              "동일한 이메일이 존재합니다. 이메일을 변경하시기 바랍니다.",
            result: result,
          });
        }

        try {
          // 비밀번호 해시화
          const saltRounds = 10;
          const hashedPassword = await bcrypt.hash(mem_app_password, saltRounds);

          const query = 
            `
              UPDATE members SET
                mem_email_id = ?
                , mem_app_password = ?
                , mem_app_status = 'PROCEED'
                , mem_role = ?
                , app_reg_dt = DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')
                , app_reg_id = ?
              WHERE mem_id = ?
            `;
          db.query(
            query,
            [
              mem_email_id,
              hashedPassword,
              mem_role,
              mem_id,
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
    const { mem_id, mem_email_id, mem_role } = req.body;

    // 현재 날짜 형식화
    const now = dayjs();
    const app_mod_dt = now.format("YYYYMMDDHHmmss");

    // members 테이블에 어플 회원 비밀번호 정보 수정
    const memberUpdateQuery = `
      UPDATE members SET
        mem_email_id = ?,
        mem_role = ?,
        app_mod_dt = ?,
        app_mod_id = ?
      WHERE mem_id = ?
    `;

    db.query(
      memberUpdateQuery,
      [
        mem_email_id,
        mem_role,
        app_mod_dt,
        mem_id,
        mem_id,
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
  } catch (error) {
    console.error("어플 회원 정보 수정 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 어플 회원 비밀번호 수정
exports.updateMemberAppPassword = (req, res) => {
  try {
    const { mem_id, mem_app_password } = req.body;

    // 현재 날짜 형식화
    const now = dayjs();
    const app_mod_dt = now.format("YYYYMMDDHHmmss");

    // 비밀번호 해시화
    const bcrypt = require("bcrypt");
    const saltRounds = 10;
    const hashedPassword = bcrypt.hashSync(mem_app_password, saltRounds);

    // members 테이블에 어플 회원 비밀번호 정보 수정
    const memberUpdateQuery = `
      UPDATE members SET
        mem_app_password = ?,
        app_mod_dt = ?,
        app_mod_id = ?
      WHERE mem_id = ?
    `;

    db.query(
      memberUpdateQuery,
      [
        hashedPassword,
        app_mod_dt,
        mem_id,
        mem_id,
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

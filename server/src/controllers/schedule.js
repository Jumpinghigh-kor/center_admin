const db = require("./../../db");
const dayjs = require("dayjs");

//시간표 보기
exports.getSchedule = (req, res) => {
  const { center_id } = req.query;

  const query = `
    SELECT 
      schedule.*
      , COALESCE(member_counts.current_count, 0) AS current_count
      , COALESCE(upcoming_members.upcoming_count, 0) AS upcoming_count
    FROM      schedule
    LEFT JOIN (
                SELECT
                  members.mem_sch_id
                  , COUNT(*) AS current_count
                FROM  members
                JOIN  member_orders ON members.mem_id = member_orders.memo_mem_id
                JOIN  products      ON member_orders.memo_pro_id = products.pro_id
                WHERE mem_status = 1 
                AND  CURDATE() BETWEEN member_orders.memo_start_date AND member_orders.memo_end_date
                AND   (products.pro_type != '회차권' 
                      OR (products.pro_type = '회차권'
                      AND member_orders.memo_remaining_counts > 0))
                GROUP BY members.mem_sch_id
              ) AS member_counts ON schedule.sch_id = member_counts.mem_sch_id
    LEFT JOIN (
                SELECT
                  members.mem_sch_id
                  , COUNT(*) AS upcoming_count
                FROM      members
                JOIN      member_orders ON members.mem_id = member_orders.memo_mem_id
                WHERE     CURDATE() < member_orders.memo_start_date
                GROUP BY  members.mem_sch_id
              ) AS upcoming_members ON schedule.sch_id = upcoming_members.mem_sch_id
    WHERE     schedule.sch_status AND schedule.center_id = ?;
`;
  db.query(query, [center_id], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    return res.status(200).json({ result: result });
  });
};

//시간표 디테일 보기
exports.getScheduleDetail = (req, res) => {
  const { center_id } = req.query;
  const { id } = req.params;
  const query = `
    SELECT
      * 
    FROM      member_orders 
    LEFT JOIN members   ON member_orders.memo_mem_id = members.mem_id
    LEFT JOIN schedule  ON members.mem_sch_id = schedule.sch_id
    LEFT JOIN products  ON member_orders.memo_pro_id = products.pro_id
    WHERE     members.mem_status = 1 
    AND       member_orders.memo_status = 1
    AND       schedule.sch_id = ? 
    AND       schedule.center_id = ?
    AND       CURDATE() BETWEEN member_orders.memo_start_date AND member_orders.memo_end_date
    AND       (
                products.pro_type != '회차권' 
                OR (products.pro_type = '회차권' AND member_orders.memo_remaining_counts > 0)
              );`;
  db.query(query, [id, center_id], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

//시간표 보기
exports.getScheduleDetailByDate = (req, res) => {
  const { center_id } = req.query.user;
  const { startDate } = req.query;
  const { id } = req.params;
  const query = `
    SELECT
      * 
    FROM      member_orders 
    LEFT JOIN members   ON member_orders.memo_mem_id = members.mem_id
    LEFT JOIN schedule  ON members.mem_sch_id = schedule.sch_id
    LEFT JOIN products  ON member_orders.memo_pro_id = products.pro_id
    WHERE     members.mem_status = 1 
    AND       member_orders.memo_status = 1
    AND       schedule.sch_id = ? 
    AND       schedule.center_id = ?
    AND       ? BETWEEN member_orders.memo_start_date AND member_orders.memo_end_date
    AND       (
                products.pro_type != '회차권' 
                OR (products.pro_type = '회차권' AND member_orders.memo_remaining_counts > 0)
              );`;
  db.query(query, [id, center_id, startDate], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

//시간표 추가
exports.createSchedule = (req, res) => {
  const scheduleTime = dayjs(req.body[0]).format("h:mm A");
  const { sch_max_cap, sch_info } = req.body[1];
  const center_id = req.body[2];
  const query = `
    INSERT INTO schedule (
      sch_time
      , sch_max_cap
      , sch_info
      , center_id
    ) VALUES (
     ?
     , ?
     , ?
     , ?
    )`;
  db.query(
    query,
    [scheduleTime, sch_max_cap, sch_info, center_id],
    (err, result) => {
      if (err) {
        res.status(500).json(err);
      }
      res.status(201).json({ result: result });
    }
  );
};

//시간표 변경
exports.updateSchedule = (req, res) => {
  const { id } = req.params;
  const scheduleTime = dayjs(req.body[0]).format("h:mm A");
  const { sch_max_cap, sch_info } = req.body[1];
  const query = `
    UPDATE  schedule SET
      sch_time = ?
      , sch_max_cap = ?
      , sch_info = ?
    WHERE sch_id = ?`;
  db.query(query, [scheduleTime, sch_max_cap, sch_info, id], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.json({ message: "Updated the schedule", result: result });
  });
};

//시간표 삭제
exports.deleteSchedule = (req, res) => {
  const { id } = req.params;
  const query = `
    UPDATE schedule SET
      sch_status = 0
    WHERE sch_id = ?`;
  db.query(query, [id], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.json({ message: "Deleted the schedule.", result: result });
  });
};

//회원 스케줄 고정/예약 수 조회
exports.getMemberScheduleAppList = (req, res) => {
  const { start_date, end_date, center_id } = req.body;

  const query = `
    SELECT
      dates.sch_dt
      , s.sch_id
      , s.sch_time
      , s.sch_info
      , s.sch_max_cap
      , COALESCE(SUM(CASE WHEN cnt.original_sch_id = s.sch_id THEN cnt.member_cnt END), 0) AS registered_count
      , COALESCE(SUM(CASE WHEN cnt.final_sch_id = s.sch_id THEN cnt.member_cnt END), 0) AS total_count
      , s.sch_max_cap - COALESCE(SUM(CASE WHEN cnt.final_sch_id = s.sch_id THEN cnt.member_cnt END), 0) AS remaining
      , COALESCE(ac.agree_yn_cnt, 0) AS agree_yn_cnt
      , COALESCE(cur.current_count, 0) AS current_count
      , COALESCE(pc.reserved_count, 0) AS reserved_count
    FROM (
          SELECT
            DATE_ADD(?, INTERVAL seq.seq DAY) AS sch_dt
          FROM  (
                  SELECT 0 AS seq UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24 UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29 UNION ALL SELECT 30
                ) seq
          WHERE DATE_ADD(?, INTERVAL seq.seq DAY) <= ?
    ) dates

    CROSS JOIN schedule s
    
    LEFT JOIN (
                SELECT
                  md.start_dt
                  , md.original_sch_id
                  , md.final_sch_id
                  , COUNT(DISTINCT md.mem_id) AS member_cnt
                FROM  (
                        SELECT
                          c.start_dt
                          , mb.mem_id
                          , mb.mem_sch_id AS original_sch_id
                          , COALESCE(r.reservation_sch_id, mb.mem_sch_id) AS final_sch_id
                        FROM  (
                                SELECT
                                  DATE_ADD(?, INTERVAL seq.seq DAY) AS start_dt
                                FROM  (
                                        SELECT
                                          0 AS seq
                                          
                                          UNION ALL
                                          
                                          SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24 UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29 UNION ALL SELECT 30
                                      ) seq
                                WHERE DATE_ADD(?, INTERVAL seq.seq DAY) <= ?
                              ) c
                INNER JOIN (
                            SELECT
                              m.mem_id
                              , m.mem_sch_id
                              , m.center_id
                            FROM        members m
                            WHERE       m.center_id = ?
                            AND         m.mem_status = 1
                            AND         EXISTS (
                                                SELECT 
                                                  1
                                                FROM        member_orders mo
                                                INNER JOIN  products p ON p.pro_id = mo.memo_pro_id
                                                WHERE       mo.memo_mem_id = m.mem_id
                                                AND         CURDATE() BETWEEN mo.memo_start_date AND mo.memo_end_date
                                                AND         (p.pro_type != '회차권' OR (p.pro_type = '회차권' AND mo.memo_remaining_counts > 0))
                                              )
                          ) mb ON 1=1
                LEFT JOIN (
                            SELECT
                              msa.mem_id
                              , msa.reservation_sch_id
                              , msa.sch_dt
                            FROM    member_schedule_app msa
                            WHERE   msa.del_yn = 'N'
                            AND     (msa.agree_yn = 'Y' OR msa.agree_yn IS NULL)
                            AND     msa.sch_dt BETWEEN DATE_FORMAT(?, '%Y%m%d') AND DATE_FORMAT(?, '%Y%m%d')
                          ) r ON r.mem_id = mb.mem_id AND r.sch_dt = DATE_FORMAT(c.start_dt, '%Y%m%d')
                        ) md
                GROUP BY md.start_dt, md.original_sch_id, md.final_sch_id
              ) cnt ON cnt.start_dt = dates.sch_dt
    LEFT JOIN (
                SELECT
                  STR_TO_DATE(msa.sch_dt, '%Y%m%d') AS start_dt
                  , msa.reservation_sch_id AS sch_id
                  , COUNT(*) AS agree_yn_cnt
                FROM  member_schedule_app msa
                WHERE msa.del_yn = 'N'
                AND   msa.agree_yn IS NOT NULL
                AND   msa.sch_dt BETWEEN DATE_FORMAT(?, '%Y%m%d') AND DATE_FORMAT(?, '%Y%m%d')
                GROUP BY STR_TO_DATE(msa.sch_dt, '%Y%m%d'), msa.reservation_sch_id
              ) ac ON ac.start_dt = dates.sch_dt AND ac.sch_id = s.sch_id
        LEFT JOIN (
                SELECT
                  STR_TO_DATE(msa.sch_dt, '%Y%m%d') AS start_dt
                  , msa.reservation_sch_id AS sch_id
                  , COUNT(DISTINCT msa.mem_id) AS current_count
                FROM  member_schedule_app msa
                WHERE msa.del_yn = 'N'
                AND   msa.sch_dt BETWEEN DATE_FORMAT(?, '%Y%m%d') AND DATE_FORMAT(?, '%Y%m%d')
                AND   (
                        msa.reservation_sch_id = msa.original_sch_id
                        OR msa.agree_yn = 'Y'
                      )
                GROUP BY STR_TO_DATE(msa.sch_dt, '%Y%m%d'), msa.reservation_sch_id
              ) cur ON cur.start_dt = dates.sch_dt AND cur.sch_id = s.sch_id 
    LEFT JOIN (
                SELECT
                  STR_TO_DATE(msa.sch_dt, '%Y%m%d') AS start_dt
                  , msa.reservation_sch_id AS sch_id
                  , COUNT(DISTINCT msa.mem_id) AS reserved_count
                FROM  member_schedule_app msa
                WHERE msa.del_yn = 'N'
                AND   msa.agree_yn IS NULL
                AND   msa.sch_dt BETWEEN DATE_FORMAT(?, '%Y%m%d') AND DATE_FORMAT(?, '%Y%m%d')
                GROUP BY STR_TO_DATE(msa.sch_dt, '%Y%m%d'), msa.reservation_sch_id
              ) pc ON pc.start_dt = dates.sch_dt AND pc.sch_id = s.sch_id
    WHERE   s.center_id = ?
    AND     s.sch_status = 1
    GROUP BY dates.sch_dt, s.sch_id, s.sch_time, s.sch_max_cap, ac.agree_yn_cnt, cur.current_count, pc.reserved_count
    ORDER BY dates.sch_dt, s.sch_time
  `;

  db.query(query, [
    start_date, start_date, end_date,
    start_date, start_date, end_date,
    center_id,
    start_date, end_date,
    start_date, end_date,
    start_date, end_date,
    start_date, end_date,
    center_id
  ], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    return res.status(200).json({ result: result });
  });
};

// 예약 회원 리스트 보기
exports.getReservationMemberList = (req, res) => {
  const { sch_dt, sch_id } = req.body;
  
  const query = `
    SELECT
      m.mem_name
      , m.mem_id
      , m.mem_sch_id
      , CASE
          WHEN m.mem_gender = '1' THEN '남자'
          ELSE '여자'
        END AS mem_gender
      , CONCAT(SUBSTRING(m.mem_phone, 1, 3), '-', SUBSTRING(m.mem_phone, 4, 4), '-', SUBSTRING(m.mem_phone, 8, 4)) AS mem_phone
      , DATE_FORMAT(m.mem_birth, '%Y-%m-%d') AS mem_birth
      , msa.sch_app_id
      , DATE_FORMAT(msa.sch_dt, '%Y-%m-%d') AS sch_dt
      , msa.admin_memo
      , msa.original_sch_id
      , msa.reservation_sch_id
      , msa.agree_yn
      , (
          SELECT
            CASE 
              WHEN ss.sch_time LIKE '% AM' THEN CONCAT('오전 ', REPLACE(ss.sch_time, ' AM', ''))
              WHEN ss.sch_time LIKE '% PM' THEN CONCAT('오후 ', REPLACE(ss.sch_time, ' PM', ''))
              ELSE ss.sch_time
            END
          FROM	schedule ss
          WHERE	ss.sch_id = msa.original_sch_id
      ) AS original_sch_time
      , (
          SELECT
            ss.sch_info
          FROM	schedule ss
          WHERE	ss.sch_id = msa.original_sch_id
      ) AS original_sch_info
      , (
          SELECT
            CASE 
              WHEN ss.sch_time LIKE '% AM' THEN CONCAT('오전 ', REPLACE(ss.sch_time, ' AM', ''))
              WHEN ss.sch_time LIKE '% PM' THEN CONCAT('오후 ', REPLACE(ss.sch_time, ' PM', ''))
              ELSE ss.sch_time
            END
          FROM	schedule ss
          WHERE	ss.sch_id = msa.reservation_sch_id
      ) AS reservation_sch_time
      , (
          SELECT
            ss.sch_info
          FROM	schedule ss
          WHERE	ss.sch_id = msa.reservation_sch_id
      ) AS reservation_sch_info
    FROM		    members m
    INNER JOIN	member_schedule_app msa ON m.mem_id= msa.mem_id
    WHERE			  m.mem_status = 1
    AND		      msa.del_yn = 'N'
    AND		      (msa.agree_yn IS NULL OR msa.agree_yn = 'Y')
    AND			    msa.sch_dt = ?
    AND         msa.reservation_sch_id = ?
  `;

  db.query(query, [sch_dt, sch_id], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    return res.status(200).json({ result: result });
  });
};

// 예약 회원 리스트 (날짜만)
exports.getReservationMemberListByDate = (req, res) => {
  const { sch_dt } = req.body;
  const query = `
    SELECT
      m.mem_name
      , m.mem_id
    FROM        members m
    INNER JOIN  member_schedule_app msa ON m.mem_id = msa.mem_id
    WHERE       m.mem_status = 1
    AND         msa.del_yn = 'N'
    AND         (msa.agree_yn IS NULL OR msa.agree_yn = 'Y')
    AND         msa.sch_dt = ?
  `;

  db.query(query, [sch_dt], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    return res.status(200).json({ result: result });
  });
};

//고정 회원 리스트 보기
exports.getRegisteredMemberList = (req, res) => {
  const { sch_id, sch_dt } = req.body;
  
  const query = `
    SELECT 
      m.mem_id
      , m.mem_name
      , CASE
          WHEN m.mem_gender = '1' THEN '남자'
          ELSE '여자'
        END AS mem_gender
      , CONCAT(SUBSTRING(m.mem_phone, 1, 3), '-', SUBSTRING(m.mem_phone, 4, 4), '-', SUBSTRING(m.mem_phone, 8, 4)) AS mem_phone
      , DATE_FORMAT(m.mem_birth, '%Y-%m-%d') AS mem_birth
      , m.mem_sch_id AS sch_id
      , s.sch_time
      , s.sch_info
      , s.sch_max_cap
    FROM		    members m
    INNER JOIN 	schedule s              ON s.sch_id = m.mem_sch_id
    WHERE 		  m.mem_status = 1
    AND 		    s.sch_status = 1
    AND         EXISTS (
                        SELECT
                          1
                        FROM        member_orders mo
                        INNER JOIN  products p ON p.pro_id = mo.memo_pro_id
                        WHERE       mo.memo_mem_id = m.mem_id
                        AND         CURDATE() BETWEEN mo.memo_start_date AND mo.memo_end_date
                        AND         (
                                      p.pro_type != '회차권'
                                      OR (p.pro_type = '회차권' AND mo.memo_remaining_counts > 0)
                                    )
                      )
    AND 		    s.sch_id = ?
    AND 		    m.mem_id NOT IN (
                                  SELECT
                                    msa.mem_id
                                  FROM 	member_schedule_app msa
                                  WHERE msa.del_yn = 'N'
                                  AND (msa.agree_yn = 'Y' OR msa.agree_yn IS NULL)
                                  AND 	msa.sch_dt = ?
                                )
    ORDER BY m.mem_id DESC
  `;

  db.query(query, [sch_id, sch_dt], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json(err);
    }
    return res.status(200).json({ result: result });
  });
};

// 회원 예약 등록
exports.insertMemberScheduleApp = (req, res) => {
  try {
    const { mem_id, original_sch_id, reservation_sch_id, sch_dt, userId } = req.body;

    // 현재 날짜 형식화
    const now = dayjs();
    const reg_dt = now.format("YYYYMMDDHHmmss");

    // notices_app 테이블에 공지사항 정보 등록
    const memberScheduleAppInsertQuery = `
      INSERT INTO member_schedule_app (
        mem_id
        , original_sch_id
        , reservation_sch_id
        , sch_dt
        , agree_yn
        , del_yn
        , admin_memo
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

    db.query(
      memberScheduleAppInsertQuery,
      [
        mem_id,
        original_sch_id,
        reservation_sch_id,
        sch_dt,
        'Y',
        'N',
        null,
        reg_dt,
        userId || null,
        null,
        null,
      ],
      (memberScheduleAppErr, memberScheduleAppResult) => {
        if (memberScheduleAppErr) {
          console.error("회원 예약 등록 오류:", memberScheduleAppErr);
          return res
            .status(500)
            .json({ error: "회원 예약 등록 중 오류가 발생했습니다." });
        }

        res.status(201).json({
          memberScheduleAppId: memberScheduleAppResult.insertId,
          message: "회원 예약이 성공적으로 등록되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("회원 예약 등록 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

//회원 스케줄 앱 승인/거절 업데이트
exports.updateMemberScheduleApp = (req, res) => {
  const { sch_app_id, agree_yn, mem_id } = req.body;

  const query = `UPDATE member_schedule_app SET
                  agree_yn = ?
                  , mod_dt = DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')
                  , mod_id = ?
                 WHERE sch_app_id IN (?)`;

  db.query(query, [agree_yn, mem_id, sch_app_id], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    return res.status(200).json({
      message: "예약 상태가 업데이트되었습니다.",
      result: result,
    });
  });
};

//회원 스케줄 앱 메모 업데이트
exports.updateMemberScheduleAppMemo = (req, res) => {
  const { sch_app_id, mem_id, memo } = req.body;

  const query = `UPDATE member_schedule_app SET
                  admin_memo = ?
                  , mod_dt = DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')
                  , mod_id = ?
                 WHERE sch_app_id = ?`;

  db.query(query, [memo, mem_id, sch_app_id], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    return res.status(200).json({
      message: "메모가 업데이트되었습니다.",
      result: result,
    });
  });
};

// 예약 회원 리스트 보기
exports.getReservationMemberCnt = (req, res) => {
  const { center_id } = req.body;

  const query = `
    SELECT
      COUNT(*) AS cnt
    FROM		  members m
    LEFT JOIN	member_schedule_app msa ON m.mem_id = msa.mem_id
    WHERE		  msa.agree_yn IS NULL
    AND			  DATE_FORMAT(NOW(), '%Y%m%d%H%i%s') <= DATE_FORMAT(STR_TO_DATE(msa.sch_dt, '%Y%m%d'), '%Y%m%d%H%i%s')
    AND			  m.center_id = ?
  `;

  db.query(query, [center_id], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    return res.status(200).json({ result: result });
  });
};
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

//회원 스케줄 앱 리스트 보기
exports.getMemberScheduleAppList = (req, res) => {
  const { targetDate, center_id } = req.body;

  const query = `
    WITH RECURSIVE calendar_dates AS (
      SELECT
        DATE(?) AS sch_dt
      
      UNION ALL
      
      SELECT
        DATE_ADD(sch_dt, INTERVAL 1 DAY)
      FROM  calendar_dates
      WHERE sch_dt < LAST_DAY(?)
    ),

    member_counts AS (
      SELECT 
        cd.sch_dt
        , m.mem_sch_id AS sch_id
        , COUNT(DISTINCT m.mem_id) AS registered_count
      FROM        calendar_dates cd
      INNER JOIN  members m ON m.mem_status = 1
      INNER JOIN  member_orders mo ON mo.memo_mem_id = m.mem_id
      INNER JOIN  products p ON p.pro_id = mo.memo_pro_id
      WHERE       (mo.memo_start_date <= cd.sch_dt AND cd.sch_dt <= mo.memo_end_date)
      AND         (
                    p.pro_type != '회차권'
                    OR (p.pro_type = '회차권' AND mo.memo_remaining_counts > 0)
                  )
      GROUP BY cd.sch_dt, m.mem_sch_id
    ),

    reservation_counts AS (
      SELECT 
        STR_TO_DATE(msa.sch_dt, '%Y%m%d') AS sch_dt
        , msa.reservation_sch_id AS sch_id
        , COUNT(DISTINCT msa.mem_id) AS reserved_count
      FROM        member_schedule_app msa
      INNER JOIN  members m ON msa.mem_id = m.mem_id AND m.mem_status = 1
      INNER JOIN  member_orders mo ON mo.memo_mem_id = m.mem_id
      INNER JOIN  products p ON p.pro_id = mo.memo_pro_id
      WHERE       msa.del_yn = 'N'
      AND         (mo.memo_start_date <= STR_TO_DATE(msa.sch_dt, '%Y%m%d') AND STR_TO_DATE(msa.sch_dt, '%Y%m%d') <= mo.memo_end_date)
      AND         (
                    p.pro_type != '회차권'
                    OR (p.pro_type = '회차권' AND mo.memo_remaining_counts > 0)
                  )
      GROUP BY STR_TO_DATE(msa.sch_dt, '%Y%m%d'), msa.reservation_sch_id
    )

    SELECT 
      DATE_FORMAT(cd.sch_dt, '%Y-%m-%d') AS sch_dt
      , s.sch_id
      , CASE 
          WHEN s.sch_time LIKE '% AM' THEN CONCAT('오전 ', REPLACE(s.sch_time, ' AM', ''))
          WHEN s.sch_time LIKE '% PM' THEN CONCAT('오후 ', REPLACE(s.sch_time, ' PM', ''))
          ELSE s.sch_time
        END AS sch_time
      , s.sch_info
      , s.sch_max_cap
      , COALESCE(mc.registered_count, 0) AS registered_count
      , COALESCE(rc.reserved_count, 0) AS reserved_count
    FROM        calendar_dates cd
    CROSS JOIN  schedule s
    LEFT JOIN   member_counts mc ON mc.sch_dt = cd.sch_dt AND mc.sch_id = s.sch_id
    LEFT JOIN   reservation_counts rc ON rc.sch_dt = cd.sch_dt AND rc.sch_id = s.sch_id
    WHERE       s.sch_status = 1
    AND         s.center_id = ?
    ORDER BY cd.sch_dt, s.sch_time;
  `;

  db.query(query, [targetDate, targetDate, center_id], (err, result) => {
    if (err) {
      console.log(err);
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
    AND			    msa.sch_dt = ?
    AND         msa.reservation_sch_id = ?
  `;

  db.query(query, [sch_dt, sch_id], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json(err);
    }
    return res.status(200).json({ result: result });
  });
};

//고 정 회원 리스트 보기
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
    INNER JOIN 	schedule s ON s.sch_id = m.mem_sch_id
    INNER JOIN 	member_orders mo ON mo.memo_mem_id = m.mem_id
    INNER JOIN 	products p ON p.pro_id = mo.memo_pro_id
    WHERE 		  m.mem_status = 1
    AND 		    s.sch_status = 1
    AND 		    CURDATE() BETWEEN mo.memo_start_date AND mo.memo_end_date
    AND 		    (
                  p.pro_type != '회차권'
                  OR (p.pro_type = '회차권' AND mo.memo_remaining_counts > 0)
                )
    AND 		    s.sch_id = ?
    AND 		    m.mem_id NOT IN (
                                  SELECT
                                    msa.mem_id
                                  FROM 	member_schedule_app msa
                                  WHERE 	msa.del_yn = 'N'
                                  AND 	msa.agree_yn = 'Y'
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

//회원 스케줄 앱 승인/거절 업데이트
exports.updateMemberScheduleApp = (req, res) => {
  const { sch_app_id, agree_yn, mem_id } = req.body;

  const query = `UPDATE member_schedule_app SET
                  agree_yn = ?
                  , mod_dt = DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')
                  , mod_id = ?
                 WHERE sch_app_id IN (?)`;

  db.query(query, [agree_yn, mem_id, sch_app_id], (err, result) => {
    console.log(err);
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

const db = require("../../../db");

// 총 가입 된 회원수 조회
exports.selectMemberCount = (req, res) => {
  const { center_id } = req.body;

  let addConditions = '';
  let params = [];

  if(center_id) {
    addConditions = `WHERE m.center_id = ?`;
    params.push(center_id);
  }

  const query = `
    SELECT 
      s.status AS mem_app_status
      , COUNT(m.mem_id) AS count
      , SUM(
            CASE 
              WHEN DATE_FORMAT(m.recent_dt, '%Y%m%d') = DATE_FORMAT(NOW(), '%Y%m%d') THEN 1 
              ELSE 0 
            END) AS recent_cnt
      , SUM(
            CASE 
              WHEN DATE_FORMAT(m.app_reg_dt, '%Y%m') = DATE_FORMAT(NOW(), '%Y%m') THEN 1 
              ELSE 0 
            END) AS reg_cnt
    FROM (
          SELECT 'ACTIVE' AS status
          UNION ALL
          SELECT 'PROCEED'
          UNION ALL
          SELECT 'EXIT'
        ) s
    LEFT JOIN 	members m	ON m.mem_app_status = s.status
    ${addConditions}
    GROUP BY    s.status
  `;

  db.query(query, params, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 총 가입 된 회원 목록록 조회
exports.selectMemberList = (req, res) => {
  const { center_id, status_app_type, recent_yn, month_reg_yn } = req.body;

  let addConditions = '';
  
  if(status_app_type === "ACTIVE") {
    addConditions = 'AND mem_app_status = "ACTIVE"';
  } else if(status_app_type === "PROCEED") {
    addConditions = 'AND mem_app_status = "PROCEED"';
  } else if(status_app_type === "EXIT") {
    addConditions = 'AND mem_app_status = "EXIT"';
  } else {
    addConditions = 'AND mem_app_status IS NOT NULL';
  }

  if(recent_yn === "Y") {
    addConditions = 'AND DATE_FORMAT(recent_dt, "%Y%m%d") = DATE_FORMAT(NOW(), "%Y%m%d")';
  }

  if(month_reg_yn === "Y") {
    addConditions = 'AND DATE_FORMAT(app_reg_dt, "%Y%m") = DATE_FORMAT(NOW(), "%Y%m")';
  }

  const query = `
    SELECT
      mem_id
      , mem_name
      , mem_nickname
      , mem_app_id
      , CONCAT(SUBSTRING(mem_phone, 1, 3), '-', SUBSTRING(mem_phone, 4, 4), '-', SUBSTRING(mem_phone, 8, 4)) AS mem_phone
      , mem_app_status
      , mem_gender
      , mem_birth
      , mem_role
      , DATE_FORMAT(app_reg_dt, '%Y-%m-%d %H:%i:%s') AS app_reg_dt
      , app_exit_dt
    FROM  members
    WHERE mem_status = 1
    AND   center_id = ?
    ${addConditions}
    ORDER BY mem_app_status, mem_id DESC
  `;

  db.query(query, [center_id], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 월별 가입 된 회원수 조회
exports.selectMonthlyMemberList = (req, res) => {
  const { center_id } = req.body;

  let addConditions = '';
  let params = [];

  if(center_id) {
    addConditions = `AND m.center_id = ?`;
    params.push(center_id);
  }

  const query = `
    SELECT 
      CONCAT(YEAR(NOW()), RIGHT(CONCAT('0', mn.mn), 2)) AS month_num
      , COUNT(CASE WHEN m.mem_app_status = 'ACTIVE'   AND LEFT(m.app_reg_dt, 6)   = CONCAT(YEAR(NOW()), RIGHT(CONCAT('0', mn.mn), 2)) THEN 1 END) AS active_count
      , COUNT(CASE WHEN m.mem_app_status = 'PROCEED'  AND LEFT(m.app_reg_dt, 6)   = CONCAT(YEAR(NOW()), RIGHT(CONCAT('0', mn.mn), 2)) THEN 1 END) AS proceed_count
      , COUNT(CASE WHEN m.mem_app_status = 'EXIT'     AND LEFT(m.app_exit_dt, 6)  = CONCAT(YEAR(NOW()), RIGHT(CONCAT('0', mn.mn), 2)) THEN 1 END) AS exit_count
    FROM (
            SELECT 1  AS mn 		UNION ALL SELECT 2 	UNION ALL SELECT 3
            UNION ALL SELECT 4 	UNION ALL SELECT 5 	UNION ALL SELECT 6
            UNION ALL SELECT 7 	UNION ALL SELECT 8 	UNION ALL SELECT 9
            UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12
          ) mn
    LEFT JOIN 	members m ON (
                                (LEFT(m.app_reg_dt, 6) = CONCAT(YEAR(NOW()), RIGHT(CONCAT('0', mn.mn), 2)) AND m.mem_app_status IN ('ACTIVE', 'PROCEED'))
                                OR 
                                (LEFT(m.app_exit_dt, 6) = CONCAT(YEAR(NOW()), RIGHT(CONCAT('0', mn.mn), 2)) AND m.mem_app_status = 'EXIT')
                              )
    AND 		    m.mem_status = 1
    AND 		    m.mem_app_status IS NOT NULL
    ${addConditions}
    GROUP BY 	  month_num
    ORDER BY 	  month_num
  `;

  db.query(query, params, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 매출 조회
exports.selectSalesList = (req, res) => {
  const { center_id, period, year, month } = req.body;
  let query = '';

  let addConditions = '';
  if(center_id) {
    addConditions = `AND m.center_id = ?`;
  }

  if(period === "day") {
    query = `
      SELECT
        cal.calendar_date AS day,
        COALESCE(SUM(paid.paid_amount), 0) AS total_amount,
        COUNT(DISTINCT CASE WHEN paid.order_app_id IS NOT NULL THEN moa.order_app_id END) AS order_count
      FROM (
              SELECT 
                DATE_ADD(DATE(CONCAT(?, '-', ?, '-01')), INTERVAL daynum DAY) AS calendar_date
              FROM (
                      SELECT 0 AS daynum UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
                      UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
                      UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14
                      UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19
                      UNION ALL SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24
                      UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29
                      UNION ALL SELECT 30
                    ) AS days
              WHERE DATE_ADD(DATE(CONCAT(?, '-', ?, '-01')), INTERVAL daynum DAY) <= LAST_DAY(CONCAT(?, '-', ?, '-01'))
            ) AS cal
      LEFT JOIN (
                  SELECT
                    moa.order_app_id
                    , moa.mem_id
                    , moa.order_dt
                  FROM        member_order_app moa
                  INNER JOIN  members m ON m.mem_id = moa.mem_id
                  ${addConditions}
                  WHERE       moa.del_yn = 'N'
                ) AS moa
      ON moa.order_dt >= cal.calendar_date
      AND moa.order_dt <  cal.calendar_date + INTERVAL 1 DAY
      LEFT JOIN (
                  SELECT
                    order_app_id
                    , SUM(payment_amount) AS paid_amount
                  FROM  member_payment_app
                  WHERE payment_status = 'PAYMENT_COMPLETE'
                  GROUP BY order_app_id
                ) AS paid
      ON paid.order_app_id = moa.order_app_id
      GROUP BY cal.calendar_date
      ORDER BY cal.calendar_date;
    `;
  } else if(period === "week"){
    query = `
      SELECT
        CONCAT('W', weekinfo.week_of_month) AS week_label,
        COALESCE(SUM(paid.paid_amount), 0)  AS total_amount,
        COUNT(DISTINCT
                CASE
                  WHEN paid.order_app_id IS NOT NULL THEN moa.order_app_id
                  END
                ) AS order_count
      FROM (
              SELECT 
                DATE_ADD(DATE(CONCAT(?, '-', ?, '-01')), INTERVAL daynum DAY) AS calendar_date,
                WEEK(DATE_ADD(DATE(CONCAT(?, '-', ?, '-01')), INTERVAL daynum DAY), 1)
                - WEEK(DATE(CONCAT(?, '-', ?, '-01')), 1) + 1 AS week_of_month
              FROM (
                      SELECT 0 AS daynum UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4
                      UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9
                      UNION ALL SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14
                      UNION ALL SELECT 15 UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19
                      UNION ALL SELECT 20 UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24
                      UNION ALL SELECT 25 UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29
                      UNION ALL SELECT 30
                    ) AS days
              WHERE DATE_ADD(DATE(CONCAT(?, '-', ?, '-01')), INTERVAL daynum DAY) <= LAST_DAY(CONCAT(?, '-', ?, '-01'))
            ) AS weekinfo
      LEFT JOIN (
                  SELECT
                    moa.order_app_id
                    , moa.mem_id
                    , moa.order_dt
                  FROM        member_order_app moa
                  INNER JOIN  members m ON m.mem_id = moa.mem_id
                  ${addConditions}
                  WHERE       moa.del_yn = 'N'
                ) AS moa
      ON moa.order_dt >= weekinfo.calendar_date
      AND moa.order_dt <  weekinfo.calendar_date + INTERVAL 1 DAY
      LEFT JOIN (
                  SELECT
                    order_app_id
                    , SUM(payment_amount) AS paid_amount
                  FROM  member_payment_app
                  WHERE payment_status = 'PAYMENT_COMPLETE'
                  GROUP BY order_app_id
                ) AS paid
      ON paid.order_app_id = moa.order_app_id
      GROUP BY weekinfo.week_of_month
      ORDER BY weekinfo.week_of_month;
    `
  } else if(period === "month"){
    query = `
      SELECT
        DATE_FORMAT(mon.month_start, '%Y-%m') AS month_label,
        COALESCE(SUM(paid.paid_amount), 0) AS total_amount,
        COUNT(DISTINCT
                CASE
                  WHEN paid.order_app_id IS NOT NULL THEN moa.order_app_id
                  END
                ) AS order_count
      FROM  (
              SELECT
                mm.m,
                STR_TO_DATE(CONCAT(?, '-', LPAD(mm.m, 2, '0'), '-01'), '%Y-%m-%d') AS month_start,
                DATE_ADD(STR_TO_DATE(CONCAT(?, '-', LPAD(mm.m, 2, '0'), '-01'), '%Y-%m-%d'), INTERVAL 1 MONTH) AS month_end
              FROM (
                      SELECT 1 AS m UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL
                      SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL
                      SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL
                      SELECT 10 UNION ALL SELECT 11 UNION ALL SELECT 12
                    ) AS mm
            ) AS mon
      LEFT JOIN (
                  SELECT
                    moa.order_app_id
                    , moa.mem_id
                    , moa.order_dt
                  FROM        member_order_app moa
                  INNER JOIN  members m ON m.mem_id = moa.mem_id
                  ${addConditions}
                  WHERE       moa.del_yn = 'N'
                ) AS moa
      ON  moa.order_dt >= mon.month_start
      AND moa.order_dt <  mon.month_end
      LEFT JOIN (
                  SELECT order_app_id, SUM(payment_amount) AS paid_amount
                  FROM member_payment_app
                  WHERE payment_status = 'PAYMENT_COMPLETE'
                  GROUP BY order_app_id
                ) AS paid
      ON paid.order_app_id = moa.order_app_id
      GROUP BY mon.m
      ORDER BY mon.m;
    ;`
  } else {
    query = `
      SELECT
        yl.year AS year_label,
        COALESCE(SUM(paid.paid_amount), 0) AS total_amount,
        COUNT(DISTINCT
                CASE
                  WHEN paid.order_app_id IS NOT NULL THEN moa.order_app_id
                END
              ) AS order_count
      FROM (
              SELECT (YEAR(CURDATE()) - 4) AS year
              UNION ALL SELECT (YEAR(CURDATE()) - 3)
              UNION ALL SELECT (YEAR(CURDATE()) - 2)
              UNION ALL SELECT (YEAR(CURDATE()) - 1)
              UNION ALL SELECT  YEAR(CURDATE())
            ) AS yl
      LEFT JOIN (
        SELECT
          moa.order_app_id
          , moa.mem_id
          , moa.order_dt
        FROM        member_order_app moa
        INNER JOIN  members m  ON m.mem_id = moa.mem_id
        ${addConditions}
        WHERE       moa.del_yn = 'N'
      ) AS moa
      ON moa.order_dt >= STR_TO_DATE(CONCAT(yl.year, '-01-01'), '%Y-%m-%d')
        AND moa.order_dt <  DATE_ADD(STR_TO_DATE(CONCAT(yl.year, '-01-01'), '%Y-%m-%d'), INTERVAL 1 YEAR)
      LEFT JOIN (
                  SELECT order_app_id, SUM(payment_amount) AS paid_amount
                  FROM member_payment_app
                  WHERE payment_status = 'PAYMENT_COMPLETE'
                  GROUP BY order_app_id
                ) AS paid
      ON paid.order_app_id = moa.order_app_id
      GROUP BY yl.year
      ORDER BY yl.year;
    `
  }

  let params = [];
  
  if(period === "day") {
    params = [year, month, year, month, year, month, center_id];
  } else if(period === "week"){
    params = [year, month, year, month, year, month, year, month, year, month, center_id];
  } else if(period === "month"){
    params = [year, year, center_id];
  } else {
    params = [center_id];
  }

  db.query(query, params, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 결제 분석 조회
exports.selectPaymentAnalysisList = (req, res) => {
  const { center_id } = req.body;

  let addConditions = '';
  let addSubConditions = '';
  let addSubParams = [];

  if(center_id) {
    addSubConditions = `AND sm.center_id = ?`;
    addSubParams.push(center_id);
  }

  if(center_id) {
    addConditions = `AND m.center_id = ?`;
  }

  const query = `
    SELECT
      COALESCE(SUM(
                    CASE 
                      WHEN  DATE_FORMAT(moa.order_dt, '%Y%m%d') = DATE_FORMAT(NOW(), '%Y%m%d') AND mpa.payment_status = 'PAYMENT_COMPLETE' THEN mpa.payment_amount
                      ELSE  0 
                    END
                  ), 0) AS today_order_amount
      , COUNT(
              CASE
                WHEN	DATE_FORMAT(moa.order_dt, '%Y%m%d') = DATE_FORMAT(NOW(), '%Y%m%d')	AND mpa.payment_status = 'PAYMENT_COMPLETE'	THEN 1
              END) AS today_order_count
      , ROUND((
          SELECT AVG(p.total_amount)
          FROM (
            SELECT
              smoa.order_app_id,
              SUM(smpa.payment_amount) AS total_amount
            FROM        member_order_app smoa
            INNER JOIN  members sm   ON sm.mem_id = smoa.mem_id
            INNER JOIN  member_payment_app smpa ON smpa.order_app_id = smoa.order_app_id
            WHERE       smoa.del_yn = 'N'
            AND         smpa.payment_status = 'PAYMENT_COMPLETE'
            ${addSubConditions}
            GROUP BY    smoa.order_app_id
          ) p
        ), 0) AS avg_order_amount
      , ROUND(
          (
            SELECT COUNT(*)
            FROM (
              SELECT DISTINCT smoa.order_app_id
              FROM        member_order_app smoa
              INNER JOIN  member_payment_app smpa ON smoa.order_app_id = smpa.order_app_id
              INNER JOIN  members sm              ON sm.mem_id = smoa.mem_id
              WHERE       smoa.del_yn = 'N'
              AND         smpa.payment_status = 'PAYMENT_REFUND'
              AND         smpa.payment_type = 'PRODUCT_BUY'
              ${addSubConditions}
            ) refunded_orders
          )
          / NULLIF((
            SELECT COUNT(*)
            FROM (
              SELECT DISTINCT smoa.order_app_id
              FROM        member_order_app smoa
              INNER JOIN  member_payment_app smpa ON smoa.order_app_id = smpa.order_app_id
              INNER JOIN  members sm              ON sm.mem_id = smoa.mem_id
              WHERE       smoa.del_yn = 'N'
              AND         smpa.payment_type = 'PRODUCT_BUY'
              ${addSubConditions}
            ) paid_orders
          ), 0) * 100, 1
        ) AS refund_rate_percent
    FROM 		    member_order_app moa
    INNER JOIN 	member_payment_app mpa  ON moa.order_app_id = mpa.order_app_id
    INNER JOIN 	members m				        ON m.mem_id = moa.mem_id
    WHERE		    moa.del_yn = 'N'
    ${addConditions};
  `;

  db.query(query, [addSubParams, addSubParams, addSubParams, addSubParams, addConditions], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 결제 수단 조회
exports.selectPaymentMethodList = (req, res) => {
  const { center_id } = req.body;
  
  let addConditions = '';
  if(center_id) {
    addConditions = `AND m.center_id = ?`;
  }

  const query = `
    SELECT
      CASE
        WHEN mpa.card_name = 'kakaopay' THEN '카카오페이'
        ELSE mpa.card_name
      END AS card_name
      , COUNT(*) AS card_count
    FROM 		  members m
    LEFT JOIN	member_order_app moa 	  ON m.mem_id = moa.mem_id
    LEFT JOIN	member_payment_app mpa 	ON moa.order_app_id = mpa.order_app_id
    WHERE		  moa.del_yn = 'N'
    AND			  mpa.payment_status = 'PAYMENT_COMPLETE'
    ${addConditions}
    GROUP BY  mpa.card_name
    ORDER BY  card_count DESC;
  `;

  db.query(query, [center_id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 카테고리별 매출 조회
exports.selectCategorySalesList = (req, res) => {
  const { center_id } = req.body;

  let addConditions = '';
  if(center_id) {
    addConditions = `AND m.center_id = ?`;
  }

  const query = `
    SELECT
      cc.common_code_name AS category_name
      , SUM(po.paid_amount) AS category_sales
    FROM (
            SELECT
              order_app_id
              , SUM(payment_amount) AS paid_amount
            FROM  member_payment_app
            WHERE payment_status = 'PAYMENT_COMPLETE'
            GROUP BY order_app_id
          ) po
    INNER JOIN member_order_app o ON o.order_app_id = po.order_app_id
    INNER JOIN  (
                  SELECT DISTINCT
                    d.order_app_id
                    , pa.big_category
                  FROM        member_order_detail_app d
                  INNER JOIN  product_detail_app pda ON pda.product_detail_app_id = d.product_detail_app_id
                  INNER JOIN  product_app pa ON pa.product_app_id = pda.product_app_id
                ) oc ON oc.order_app_id = o.order_app_id
    INNER JOIN  members m ON m.mem_id = o.mem_id
    INNER JOIN  common_code cc ON cc.common_code = oc.big_category
    WHERE       o.del_yn = 'N'
    ${addConditions}
    GROUP BY oc.big_category
    ORDER BY cc.common_code_name DESC;
  `;

  db.query(query, [center_id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 시간대별 매출 조회
exports.selectHourlySalesList = (req, res) => {
  const { center_id } = req.body;

  let addConditions = '';
  if(center_id) {
    addConditions = `AND m.center_id = ?`;
  }

  const query = `
    SELECT
      LPAD(t.start_hour, 2, '0') AS time_range,
      COUNT(DISTINCT
              CASE
                WHEN paid.order_app_id IS NOT NULL THEN moa.order_app_id
                END
              ) AS order_count
    FROM (
            SELECT 0 AS start_hour UNION ALL
            SELECT 1 UNION ALL
            SELECT 2 UNION ALL
            SELECT 3 UNION ALL
            SELECT 4 UNION ALL
            SELECT 5 UNION ALL
            SELECT 6 UNION ALL
            SELECT 7 UNION ALL
            SELECT 8 UNION ALL
            SELECT 9 UNION ALL
            SELECT 10 UNION ALL
            SELECT 11 UNION ALL
            SELECT 12 UNION ALL
            SELECT 13 UNION ALL
            SELECT 14 UNION ALL
            SELECT 15 UNION ALL
            SELECT 16 UNION ALL
            SELECT 17 UNION ALL
            SELECT 18 UNION ALL
            SELECT 19 UNION ALL
            SELECT 20 UNION ALL
            SELECT 21 UNION ALL
            SELECT 22 UNION ALL
            SELECT 23
          ) AS t
      LEFT JOIN (
                  SELECT o.order_app_id, o.order_dt
                  FROM member_order_app AS o
                  INNER JOIN members AS m
                  ON m.mem_id = o.mem_id
                  ${addConditions}
                  WHERE o.del_yn = 'N'
                ) AS moa
    ON HOUR(moa.order_dt) = t.start_hour
    LEFT JOIN (
                SELECT
                  DISTINCT order_app_id
                FROM    member_payment_app
                WHERE   payment_status = 'PAYMENT_COMPLETE'
              ) AS paid
    ON paid.order_app_id = moa.order_app_id
    GROUP BY t.start_hour
    ORDER BY t.start_hour;
  `;

  db.query(query, [center_id], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};
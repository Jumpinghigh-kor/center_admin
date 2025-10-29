const db = require("./../../db");
const dayjs = require("dayjs");
const bcrypt = require("bcrypt");

//회원 정보 보기
exports.getMember = (req, res) => {
  const { center_id } = req.query.user;
  const { sortOption } = req.query;

  let queryParams = [center_id];
  let baseQuery = "";
  let orderClause = "";
  let addConditions = "";

  baseQuery = `
      SELECT
        m.mem_id
        , m.mem_name
        , m.mem_phone
        , m.mem_birth
        , m.mem_regist_date
        , m.mem_gender
        , m.mem_locker
        , m.mem_checkin_number
        , m.mem_manager
        , m.mem_sch_id
        , m.mem_memo
        , m.mem_status
        , m.mem_email_id
        , m.mem_app_status
        , m.mem_role
        , m.push_yn
        , m.push_token
        , DATE_FORMAT(m.app_reg_dt, '%Y-%m-%d %H:%i:%s') AS app_reg_dt
        , DATE_FORMAT(m.app_active_dt, '%Y-%m-%d %H:%i:%s') AS app_active_dt
        , m.center_id
        , m.mem_locker_number AS mem_locker_number_old
        , (
            SELECT
              smo.memo_pro_name
            FROM	member_orders smo
            WHERE	m.mem_id = smo.memo_mem_id
            AND		smo.memo_status = 1
            ORDER BY smo.memo_purchase_date DESC
            LIMIT 1
        ) AS memo_pro_name
        , (
            SELECT
              smo.memo_purchase_date
            FROM	member_orders smo
            WHERE	m.mem_id = smo.memo_mem_id
            AND		smo.memo_status = 1
            ORDER BY smo.memo_purchase_date DESC
            LIMIT 1
        ) AS memo_purchase_date
        , (
            SELECT
              smo.memo_start_date
            FROM	member_orders smo
            WHERE	m.mem_id = smo.memo_mem_id
            AND		smo.memo_status = 1
            ORDER BY smo.memo_purchase_date DESC
            LIMIT 1
        ) AS memo_start_date
        , (
            SELECT
              smo.memo_end_date
            FROM	member_orders smo
            WHERE	m.mem_id = smo.memo_mem_id
            AND		smo.memo_status = 1
            ORDER BY smo.memo_purchase_date DESC
            LIMIT 1
        ) AS memo_end_date
        , (
          SELECT
            smo.memo_remaining_counts
          FROM	member_orders smo
          WHERE	m.mem_id = smo.memo_mem_id
          AND		smo.memo_status = 1
          ORDER BY smo.memo_purchase_date DESC
          LIMIT 1
        ) AS memo_remaining_counts
        , (
            SELECT
              smo.memo_pro_price
            FROM	member_orders smo
            WHERE	m.mem_id = smo.memo_mem_id
            AND		smo.memo_status = 1
            ORDER BY smo.memo_purchase_date DESC
            LIMIT 1
        ) AS memo_pro_price
        , (
          SELECT
            sp.pro_price
          FROM	    member_orders smo
          LEFT JOIN	products sp ON smo.memo_pro_id = sp.pro_id
          WHERE	    m.mem_id = smo.memo_mem_id
          AND		    smo.memo_status = 1
          ORDER BY smo.memo_purchase_date DESC
          LIMIT 1
        ) AS pro_price
        , (
            SELECT
			        GROUP_CONCAT(
							              CASE sbl.locker_type
								              WHEN 'SHOES' 	  THEN '신발장'
                              WHEN 'CLOTHES' 	THEN '옷장'
							              ELSE '기타' END
                            , ' : ', sld.locker_number
						              )
          FROM		  locker_detail sld
          LEFT JOIN	locker_bas sbl ON	sld.locker_id = sbl.locker_id
          WHERE		  sld.mem_id = m.mem_id
          AND		    sbl.del_yn = 'N'
        ) AS mem_locker_number_new
        , (
            SELECT
              sch_time
            FROM		  schedule ms
            WHERE		  ms.sch_id = m.mem_sch_id
        ) AS sch_time
      FROM        members m
      INNER JOIN  schedule s ON s.sch_id = m.mem_sch_id 
    `;

  let commonConditions = `
      WHERE m.center_id = ?
      AND   m.mem_status = 1
    `;

  if (sortOption === "최신 등록순") {
    orderClause = `ORDER BY m.mem_regist_date DESC`;
  } else if (sortOption === "이름순") {
    orderClause = `ORDER BY m.mem_name ASC`;
  } else if (sortOption === "최초 등록순") {
    orderClause = `ORDER BY m.mem_regist_date ASC`;
  } else if (sortOption === "회원권 등록자") {
    addConditions = `
                      AND 0 < (
                                SELECT
                                  COUNT(*)
                                FROM      member_orders smo
                                LEFT JOIN products sp  ON smo.memo_pro_id = sp.pro_id
                                WHERE     smo.memo_mem_id = m.mem_id
                                AND       (DATE_FORMAT(smo.memo_start_date, '%Y%m%d000001') <= DATE_FORMAT(NOW(), '%Y%m%d%H%m%s')
                                          AND DATE_FORMAT(NOW(), '%Y%m%d%H%m%s') <= DATE_FORMAT(smo.memo_end_date, '%Y%m%d235959'))
                                AND        (sp.pro_type      != '회차권' 
                                            OR (sp.pro_type   = '회차권' AND smo.memo_remaining_counts > 0))
                              )
                      ORDER BY m.mem_name ASC;
                    `;
  } else if (sortOption === "활동 회원") {
    addConditions = `
                      AND	0 < (
                                SELECT
                                  COUNT(*)
                                FROM	member_orders smo
                                WHERE	smo.memo_mem_id = m.mem_id
                                AND		(DATE_FORMAT(smo.memo_start_date, '%Y%m%d000001') <= DATE_FORMAT(NOW(), '%Y%m%d%H%m%s')
                                      AND DATE_FORMAT(NOW(), '%Y%m%d%H%m%s') <= DATE_FORMAT(smo.memo_end_date, '%Y%m%d235959'))
                              )
                      ORDER BY m.mem_name ASC;
                    `;
  } else if (sortOption === "비활동 회원") {
    addConditions = `
                      AND	0 = (
                                SELECT
                                  COUNT(*)
                                FROM	member_orders smo
                                WHERE	smo.memo_mem_id = m.mem_id
                                AND		(DATE_FORMAT(smo.memo_start_date, '%Y%m%d000001') <= DATE_FORMAT(NOW(), '%Y%m%d%H%m%s')
                                      AND DATE_FORMAT(NOW(), '%Y%m%d%H%m%s') <= DATE_FORMAT(smo.memo_end_date, '%Y%m%d235959'))
                              )
                      ORDER BY m.mem_name ASC;
                    `;
  } else {
    queryParams = [center_id, sortOption];
    addConditions = `
                      AND       m.mem_sch_id = ? 
                      ORDER BY  m.mem_regist_date DESC
                    `;
  }

  let finalQuery = `${baseQuery} ${commonConditions} ${addConditions} ${orderClause}`;

  db.query(finalQuery, queryParams, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    return res.status(200).json({ result: result });
  });
};

//회원 추가
exports.createMember = (req, res) => {
  const {
    mem_name,
    mem_phone,
    mem_birth,
    mem_sch_id,
    mem_gender,
    mem_locker,
    mem_locker_number,
    mem_checkin_number,
    mem_manager,
    mem_memo,
    center_id,
  } = req.body;

  const checkDuplicateQuery = `SELECT * FROM members WHERE mem_status = 1 AND center_id = ? AND mem_checkin_number = ?`;

  db.query(
    checkDuplicateQuery,
    [center_id, mem_checkin_number],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }

      if (result.length > 0) {
        return res.status(400).json({
          message:
            "동일한 출입번호가 존재합니다. 출입번호를 변경하시기 바랍니다.",
          result: result,
        });
      }

      const birthDate = dayjs(mem_birth * 1000).format("YYYY-MM-DD HH:mm:ss");
      const currentDate = dayjs().format("YYYY-MM-DD HH:mm:ss");
      const query = `INSERT INTO members (mem_name, mem_phone, mem_birth, mem_regist_date, mem_gender, mem_locker, mem_locker_number, mem_checkin_number, mem_manager, mem_sch_id, mem_memo, center_id) 
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`;
      db.query(
        query,
        [
          mem_name,
          mem_phone,
          birthDate,
          currentDate,
          mem_gender,
          mem_locker,
          mem_locker === true ? mem_locker_number : "",
          mem_checkin_number,
          mem_manager,
          mem_sch_id,
          mem_memo,
          center_id,
        ],
        (err, result) => {
          if (err) {
            console.log(err);
            res.status(500).json(err);
          }
          res.status(201).json({
            message: "Created the member.",
            result: result,
          });
        }
      );
    }
  );
};

//회원 정보 변경
exports.updateMember = (req, res) => {
  const { id } = req.params;
  const {
    mem_name,
    mem_phone,
    mem_birth,
    mem_sch_id,
    mem_gender,
    mem_locker,
    mem_locker_number,
    mem_checkin_number,
    mem_manager,
    mem_memo,
    center_id,
  } = req.body;
  const birthDate = dayjs(mem_birth * 1000).format("YYYY-MM-DD HH:mm:ss");

  const checkDuplicateQuery = `SELECT * FROM members WHERE mem_status = 1 AND center_id = ? AND mem_checkin_number = ? AND mem_id != ?;`;

  db.query(
    checkDuplicateQuery,
    [center_id, mem_checkin_number, id],
    (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json(err);
      }

      if (result.length > 0) {
        return res.status(400).json({
          message:
            "동일한 출입번호가 존재합니다. 출입번호를 변경하시기 바랍니다.",
          result: result,
        });
      }

      const query = `UPDATE members SET mem_name = ?, mem_phone = ?, mem_birth = ?, mem_gender = ?, mem_locker = ?, mem_locker_number = ?, mem_checkin_number = ?, mem_manager = ?, mem_sch_id = ?, mem_memo = ? WHERE mem_id = ?`;
      db.query(
        query,
        [
          mem_name,
          mem_phone,
          birthDate,
          mem_gender,
          mem_locker,
          mem_locker === true ? mem_locker_number : "",
          mem_checkin_number,
          mem_manager,
          mem_sch_id,
          mem_memo,
          id,
        ],
        (err, result) => {
          if (err) {
            res.status(500).json(err);
          }
          res.json({ message: "Updated the member", result: result });
        }
      );
    }
  );
};

//회원 삭제
exports.deleteMember = (req, res) => {
  const { id } = req.params;
  const query = "UPDATE members SET mem_status = 0 WHERE mem_id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.json({ message: "Deleted the member.", result: result });
  });
};

//회원이 구매한 회원권 리스트 보기
exports.getMemberOrder = (req, res) => {
  const { mem_id } = req.query;
  const query =
    "SELECT * FROM member_orders INNER JOIN products ON member_orders.memo_pro_id = products.pro_id WHERE memo_mem_id = ? AND memo_status = 1";
  db.query(query, [mem_id], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

//회원이 구매한 유효한 회원권 리스트 보기
exports.getValidMemberOrder = (req, res) => {
  const { center_id } = req.query.user;
  const { sortOption } = req.query;

  let queryParams = [center_id];
  let baseQuery = "";
  let orderClause = "";

  baseQuery = `
      SELECT
        m.mem_id
        , m.mem_name
        , m.mem_birth
        , m.mem_gender
        , m.mem_phone
        , m.mem_regist_date
        , m.center_id
        , mo.memo_id
        , mo.memo_status
        , mo.memo_pro_name
        , mo.memo_remaining_counts
        , mo.memo_start_date
        , mo.memo_end_date
        , mo.memo_purchase_date
        , @rownum := @rownum + 1 AS order_seq
      FROM      (SELECT @rownum := 0) r, members m
      LEFT JOIN	member_orders mo ON m.mem_id = mo.memo_mem_id 
      WHERE		  mo.memo_status = 1
      AND       m.mem_status = 1 
      AND			  (DATE_FORMAT(mo.memo_start_date, '%Y%m%d000001') < DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')
                AND	DATE_FORMAT(NOW(), '%Y%m%d%H%i%s') < DATE_FORMAT(mo.memo_end_date, '%Y%m%d235959'))
      AND			  (memo_remaining_counts > 0 OR memo_remaining_counts IS NULL)
      AND       m.center_id = ?
    `;

  if (sortOption === "최신 등록순") {
    orderClause = `ORDER BY m.mem_regist_date DESC`;
  } else if (sortOption === "이름순") {
    orderClause = `ORDER BY m.mem_name ASC`;
  } else if (sortOption === "최초 등록순") {
    orderClause = `ORDER BY m.mem_regist_date ASC`;
  }

  let finalQuery = `${baseQuery} ${orderClause}`;

  db.query(finalQuery, queryParams, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    return res.status(200).json({ result: result });
  });
};

//회원 회원권 등록
exports.createMemberOrder = (req, res) => {
  const [members, product, startDate, { center_id }] = req.body;
  const {
    pro_id,
    pro_name,
    pro_price,
    pro_remaining_counts,
    pro_status,
    pro_months,
    pro_week,
  } = product;

  const durationType = pro_week ? "week" : "month";
  const durationValue = pro_week || pro_months;
  const memo_start_date = dayjs(startDate).format("YYYY-MM-DD HH:mm:ss");
  const memo_end_date = dayjs(memo_start_date)
    .add(durationValue, durationType)
    .subtract(1, "day")
    .format("YYYY-MM-DD");

  const query = `
      INSERT INTO member_orders (
        memo_mem_id
        , memo_pro_id
        , memo_pro_name
        , memo_pro_price
        , memo_remaining_counts
        , memo_start_date
        , memo_end_date
        , memo_purchase_date
        , memo_status
        , memo_history
        , memo_notification_sent
        , center_id
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
        , ?
      )
    `;

  let values = [
    members.mem_id,
    pro_id,
    pro_name,
    pro_price,
    pro_remaining_counts,
    memo_start_date,
    memo_end_date,
    dayjs().format("YYYY-MM-DD HH:mm:ss"),
    pro_status,
    null,
    0,
    center_id,
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    return res.status(201).json({ message: "Created the order", result });
  });
};

//회원 회원권 일괄 등록
exports.createBulkMemberOrder = (req, res) => {
  const [members, product, startDate, center_id] = req.body;
  const {
    pro_id,
    pro_name,
    pro_price,
    pro_remaining_counts,
    pro_status,
    pro_months,
    pro_week,
  } = product;
  const durationType = pro_week ? "week" : "month";
  const durationValue = pro_week || pro_months;
  const memo_start_date = dayjs(startDate).format("YYYY-MM-DD HH:mm:ss");
  const memo_end_date = dayjs(memo_start_date)
    .add(durationValue, durationType)
    .subtract(1, "day")
    .format("YYYY-MM-DD");

  let values = members.map((member) => [
    member.mem_id,
    pro_id,
    pro_name,
    pro_price,
    pro_remaining_counts,
    memo_start_date,
    memo_end_date,
    dayjs().format("YYYY-MM-DD HH:mm:ss"),
    pro_status,
    null,
    0,
    center_id,
  ]);

  const placeholders = values.map(() => "(?)").join(", ");

  const query = `
    INSERT INTO member_orders (
        memo_mem_id
        , memo_pro_id
        , memo_pro_name
        , memo_pro_price
        , memo_remaining_counts
        , memo_start_date
        , memo_end_date
        , memo_purchase_date
        , memo_status
        , memo_history
        , memo_notification_sent
        , center_id
      ) VALUES ${placeholders}
    `;

  db.query(query, values, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    return res.status(201).json({ message: "Created the order", result });
  });
};

//회원권 연장
exports.updateMemberOrder = (req, res) => {
  const { id } = req.params;
  const {
    selectedOrder,
    purchaseDate,
    startDate,
    endDate,
    reason,
    remainingCounts,
  } = req.body;
  const order_type = selectedOrder.pro_type;
  const purchase_date = dayjs(purchaseDate).format("YYYY-MM-DD HH:mm:ss");
  const start_Date = dayjs(startDate).format("YYYY-MM-DD");
  const end_Date = dayjs(endDate).format("YYYY-MM-DD");
  let query = `UPDATE member_orders SET memo_purchase_date = ?, memo_start_date = ?, memo_end_date = ?, memo_history = ? WHERE memo_id = ?`;
  let values = [purchase_date, start_Date, end_Date, reason, id];
  if (order_type === "회차권") {
    query = `UPDATE member_orders SET memo_remaining_counts = ?, memo_purchase_date = ?, memo_start_date = ?, memo_end_date = ?, memo_history = ? WHERE memo_id = ?`;
    values = [remainingCounts, purchase_date, start_Date, end_Date, reason, id];
  }

  db.query(query, values, (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.json({ message: "Updated the order", result: result });
  });
};

//회원이 구매한 회원권 삭제
exports.deleteMemberOrder = (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM member_orders WHERE memo_id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.json({ message: "Deleted the order.", result: result });
  });
};

//출석 현황 가져오기기
exports.getAttendance = (req, res) => {
  const { center_id } = req.query.user;
  const { date } = req.query;
  const selectedMonth = dayjs(date).format("YYYY-MM");
  const query = `SELECT m.mem_id, m.mem_name, DATE_FORMAT(cl.ci_date, '%Y-%m-%d') AS checkin_date
    FROM members m
    LEFT JOIN checkin_log cl ON m.mem_id = cl.ci_mem_id
    WHERE DATE_FORMAT(cl.ci_date, '%Y-%m') = ?
    AND m.mem_status = 1
    AND cl.center_id = ?
    ORDER BY m.mem_name ASC, cl.ci_date ASC;`;
  db.query(query, [selectedMonth, center_id], (err, result) => {
    if (err) {
      console.log("err", err);
      return res.status(500).json(err);
    }
    const formattedResult = result.reduce((acc, row) => {
      // 해당 mem_id가 이미 존재하는지 확인
      const existingMember = acc.find((member) => member.mem_id === row.mem_id);

      if (existingMember) {
        // 이미 존재하면 checkin_date 배열에 추가
        existingMember.checkin_dates.push(row.checkin_date);
      } else {
        // 존재하지 않으면 새로운 객체로 추가
        acc.push({
          mem_id: row.mem_id,
          mem_name: row.mem_name,
          checkin_dates: [row.checkin_date], // 새로운 배열 생성
        });
      }
      return acc;
    }, []);

    return res.status(200).json({
      message: "출석 정보를 성공적으로 불러왔습니다.",
      result: formattedResult,
    });
  });
};

//회원 회원권 일괄 등록
exports.updateBulkMemoEndDt = (req, res) => {
  const [members, extendDay] = req.body;

  let values = members.map((member) => {
    const memoEndDate = new Date(member.memo_end_date);
    memoEndDate.setDate(memoEndDate.getDate() + extendDay + 1);
    const formattedDate = memoEndDate.toISOString().split("T")[0];

    return [formattedDate, member.memo_id];
  });

  const placeholders = values.map(() => "(?, ?)").join(", ");

  const query = `
    UPDATE member_order SET
      memo_end_date = ?
    WHERE	memo_id = ?
    ${placeholders}
  `;

  const flatValues = values.flat();

  db.query(query, flatValues, (err, result) => {
    if (err) {
      console.log("err::", err);
      return res.status(500).json(err);
    }
    return res.status(201).json({ message: "Created the order", result });
  });
};

// 회원권 일괄 연장
exports.updateBulkMemoEndDt = (req, res) => {
  const [members, extendDay] = req.body;

  const queries = members.map((member) => {
    const memoEndDate = new Date(member.memo_end_date);
    memoEndDate.setDate(memoEndDate.getDate() + extendDay + 1);
    const formattedDate = memoEndDate.toISOString().split("T")[0];

    return {
      sql: `
          UPDATE member_orders SET
            memo_end_date = ?
          WHERE memo_id = ?
        `,
      values: [formattedDate, member.memo_id],
    };
  });

  Promise.all(
    queries.map((query) => {
      return new Promise((resolve, reject) => {
        db.query(query.sql, query.values, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    })
  )
    .then((results) => {
      res.status(201).json({
        message: "update success",
        results,
      });
    })
    .catch((err) => {
      console.log("err:::", err);
      res.status(500).json(err);
    });
};

exports.getAllMemberList = (req, res) => {
  let baseQuery = "";
  let orderClause = "";
  
  baseQuery = `
    SELECT
      m.mem_id
      , m.mem_name
      , m.mem_checkin_number
      , CONCAT(SUBSTRING(m.mem_phone, 1, 3), '-', SUBSTRING(m.mem_phone, 4, 4), '-', SUBSTRING(m.mem_phone, 8, 4)) AS mem_phone
      , DATE_FORMAT(m.mem_birth, '%Y-%m-%d') AS mem_birth
      , DATE_FORMAT(m.mem_regist_date, '%Y-%m-%d %H:%i') AS mem_regist_date
      , CASE
          WHEN m.mem_gender = '0' THEN '여자'
          ELSE '남자'
      END AS mem_gender
      , c.center_id
      , c.center_name
      , sch_time
      , (
          SELECT
            COUNT(*)
          FROM	member_orders smo
          WHERE	smo.memo_mem_id = m.mem_id
          AND		(DATE_FORMAT(smo.memo_start_date, '%Y%m%d000001') <= DATE_FORMAT(NOW(), '%Y%m%d%H%m%s')
                AND DATE_FORMAT(NOW(), '%Y%m%d%H%m%s') <= DATE_FORMAT(smo.memo_end_date, '%Y%m%d235959'))
        ) AS memo_status
    FROM		members m
    INNER JOIN	centers c   ON m.center_id = c.center_id
    INNER JOIN  schedule s  ON s.sch_id = m.mem_sch_id 
    WHERE		    mem_status = 1
  `;

  if (req.body.params.mem_name) {
    baseQuery += `AND m.mem_name = '${req.body.params.mem_name}'`;
  }

  if (req.body.params.center_id) {
    baseQuery += `AND c.center_id = '${req.body.params.center_id}'`;
  }

  if (req.body.params.mem_gender) {
    baseQuery += `AND m.mem_gender = '${req.body.params.mem_gender}'`;
  }
  
  if (req.body.params.mem_status === "ACTIVE") {
    baseQuery += `
                  AND	0 < (
                            SELECT
                              COUNT(*)
                            FROM	member_orders smo
                            WHERE	smo.memo_mem_id = m.mem_id
                            AND		(DATE_FORMAT(smo.memo_start_date, '%Y%m%d000001') <= DATE_FORMAT(NOW(), '%Y%m%d%H%m%s')
                                  AND DATE_FORMAT(NOW(), '%Y%m%d%H%m%s') <= DATE_FORMAT(smo.memo_end_date, '%Y%m%d235959'))
                          )`;
  } else if (req.body.params.mem_status === "INACTIVE") {
    baseQuery += `
                  AND	0 = (
                            SELECT
                              COUNT(*)
                            FROM	member_orders smo
                            WHERE	smo.memo_mem_id = m.mem_id
                            AND		(DATE_FORMAT(smo.memo_start_date, '%Y%m%d000001') <= DATE_FORMAT(NOW(), '%Y%m%d%H%m%s')
                                  AND DATE_FORMAT(NOW(), '%Y%m%d%H%m%s') <= DATE_FORMAT(smo.memo_end_date, '%Y%m%d235959'))
                          )
                `;
  }

  orderClause = `
    ORDER BY	m.mem_id DESC
  `;

  let finalQuery = `${baseQuery} ${orderClause}`;

  db.query(finalQuery, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    return res.status(200).json({ result: result });
  });
};

//회원 결제 금액 수정
exports.updateMemberOrderPrice = (req, res) => {
  const { memo_id, memo_pro_price } = req.body;
  const query = `
    UPDATE member_orders SET
      memo_pro_price = ?
    WHERE memo_id = ?
    `;
  db.query(query, [memo_pro_price, memo_id], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.json({ message: "Updated the member order price.", result: result });
  });
};
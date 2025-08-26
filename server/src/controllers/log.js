const db = require("./../../db");
const dayjs = require("dayjs");

//출석 기록 보기
exports.getCheckinLog = (req, res) => {
  const { center_id } = req.query.user;
  const selectedDate = req.query.date;
  const time = !!selectedDate
    ? dayjs(selectedDate).format("YYYY-MM-DD")
    : dayjs().format("YYYY-MM-DD");
  const query = `SELECT
      checkin_log.*
      , members.*
      , schedule.sch_time
    FROM  checkin_log
    INNER JOIN  members   ON checkin_log.ci_mem_id = members.mem_id
    INNER JOIN  schedule  ON members.mem_sch_id = schedule.sch_id
    WHERE       checkin_log.center_id = ?
    AND         DATE_FORMAT(ci_date, '%Y-%m-%d') = ?
    AND         checkin_log.del_yn = 'N'
    ;`;
  db.query(query, [center_id, time], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

//출석 기록 추가
exports.createCheckinLog = (req, res) => {
  const { center_id } = req.body[0];
  const mem_checkin_number = req.body[1];
  const query =
    "SELECT * FROM members WHERE mem_checkin_number = ? AND center_id = ? AND mem_status = 1";
  db.query(query, [mem_checkin_number, center_id], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }

    if (result.length === 0) {
      res.status(400).json({
        status: false,
        message: "해당 가맹점에 입장 번호가 일치한 회원이 없습니다.",
      });
    } else {
      const { mem_id, mem_name } = result[0];
      const getOrdersQuery = `
        SELECT
          *
        FROM      member_orders
        LEFT JOIN products ON member_orders.memo_pro_id = products.pro_id
        WHERE     memo_mem_id = ? 
        AND       memo_status = 1
        AND       CURDATE() BETWEEN member_orders.memo_start_date AND member_orders.memo_end_date
        AND       (
                    products.pro_type != '회차권' 
                    OR (products.pro_type = '회차권' AND member_orders.memo_remaining_counts > 0)
                  )
        ;`;
      db.query(getOrdersQuery, [mem_id], (err, result) => {
        if (err) {
          console.log(err);
          return res.status(500).json(err);
        }

        if (result.length === 0) {
          return res.status(400).json({
            status: false,
            message: `${mem_name}님이 등록되어 있는 회원권이 없습니다. \n 추가 결제 후 이용바랍니다.`,
          });
        }

        return res.status(201).json({
          status: true,
          result: result,
          mem_name: mem_name,
        });
      });
    }
  });
};

exports.selectMembership = (req, res) => {
  const { memo_mem_id, memo_id, pro_type, center_id } = req.body.order;
  const name = req.body.name;
  const time = dayjs().format("YYYY-MM-DD HH:mm:ss");
  const addLogQuery =
    "INSERT INTO checkin_log (ci_mem_id, ci_date, del_yn, center_id) VALUES (?,?,?,?)";
  db.query(addLogQuery, [memo_mem_id, time, "N", center_id], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    if (pro_type === "개월권") {
      return res.status(201).json({
        status: true,
        message: `${name}님 출석하였습니다.`,
      });
    } else {
      const updateRemainingCountQuery = `UPDATE member_orders SET memo_remaining_counts = memo_remaining_counts - 1 WHERE memo_id = ?`;
      db.query(updateRemainingCountQuery, [memo_id], (err) => {
        if (err) {
          return res.status(500).json(err);
        }
        return res.status(201).json({
          status: true,
          message: `${name}님 출석하였습니다.`,
        });
      });
    }
  });
};

//회원번호로 출석 기록 추가
exports.createCheckinLogbyMemId = async (req, res) => {
  const attendees = req.body[0];
  const { center_id } = req.body[1];
  const date = req.body[2];
  const updateQuery = `UPDATE member_orders SET memo_remaining_counts = memo_remaining_counts - 1 WHERE memo_id = ?`;
  try {
    const insertQueries = attendees.map((attendee) => {
      if (attendee.pro_type === "회차권") {
        db.promise().query(updateQuery, [attendee.memo_id]);
      }

      return db
        .promise()
        .query(
          "INSERT INTO checkin_log (ci_mem_id, ci_date, del_yn, center_id) VALUES (?,?,?,?)",
          [attendee.mem_id, date, "N", center_id]
        );
    });
    await Promise.all(insertQueries);
    res.status(201).json({
      status: true,
      message: `출석체크가 정상적으로 되었습니다.`,
    });
  } catch (err) {
    res.status(500).json(err);
  }
};

//출석 기록 삭제
exports.deleteCheckinLog = (req, res) => {
  const { id } = req.params;
  const query = "UPDATE checkin_log SET del_yn = 'Y' WHERE ci_id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.json({ message: "Checkin log Deleted.", result: result });
  });
};

//특정 회원번호와 날짜로 회원권 조회
exports.selectTargetCheckinLogList = (req, res) => {
  const { checkinNumber, checkinDate } = req.body;

  const query = `
    SELECT
      m.mem_id
      , p.pro_name
      , p.pro_type
      , p.pro_price
      , p.pro_remaining_counts
      , p.pro_class
      , mo.memo_id
      , mo.memo_pro_name
      , mo.memo_remaining_counts
      , mo.memo_start_date
      , mo.memo_end_date
      , mo.memo_status
    FROM      members m
    LEFT JOIN member_orders mo  ON m.mem_id = mo.memo_mem_id
    LEFT JOIN products p        ON mo.memo_pro_id = p.pro_id
    WHERE     m.mem_checkin_number = ?
    AND       (DATE_FORMAT(mo.memo_start_date, '%Y%m%d') <= DATE_FORMAT(?, '%Y%m%d')
                AND DATE_FORMAT(?, '%Y%m%d') <= DATE_FORMAT(mo.memo_end_date, '%Y%m%d'))
    `;
  db.query(query, [checkinNumber, checkinDate, checkinDate], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

//상담 기록 보기
exports.getClientCallLog = (req, res) => {
  const { center_id } = req.query;
  const query =
    "SELECT * FROM client_call_log WHERE center_id = ? ORDER BY ccl_date DESC";
  db.query(query, [center_id], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

//상담 기록 추가
exports.createClientCallLog = (req, res) => {
  const { clientName, clientPhone, clientMemo, center_id } = req.body;
  const time = dayjs().format("YYYY-MM-DD HH:mm:ss");
  const query =
    "INSERT INTO client_call_log (ccl_name, ccl_phone, ccl_memo, ccl_date, center_id) VALUES (?,?,?,?,?)";
  db.query(
    query,
    [clientName, clientPhone, clientMemo, time, center_id],
    (err, result) => {
      if (err) {
        res.status(500).json(err);
      }
      res
        .status(201)
        .json({ message: "Created the client call log", result: result });
    }
  );
};

//상담 기록 수정
exports.updateClientCallLog = (req, res) => {
  const { id } = req.params;
  const { clientName, clientPhone, clientMemo } = req.body;
  const query = `UPDATE client_call_log SET ccl_name = ?, ccl_phone = ?, ccl_memo = ? WHERE ccl_id = ?`;
  db.query(query, [clientName, clientPhone, clientMemo, id], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.json({ message: "Updated the client call log", result: result });
  });
};

//상담 기록 삭제
exports.deleteClientCallLog = (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM client_call_log WHERE ccl_id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.json({ message: "Deleted the client call log.", result: result });
  });
};

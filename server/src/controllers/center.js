const db = require("./../../db");

//센터 정보 가져오기
exports.getCenter = (req, res) => {
  const { center_id } = req.query;
  const query = "SELECT * FROM centers WHERE center_id = ?";
  db.query(query, [center_id], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

//센터 정보 변경하기
exports.updateCenter = (req, res) => {
  const { center_id, target_amount_month, target_amount_year, target_members } =
    req.body;
  const query = `UPDATE centers SET target_amount_month = ?, target_amount_year = ?, target_members = ? WHERE center_id = ?;`;
  if (
    0 >= target_amount_month ||
    0 >= target_amount_year ||
    0 >= target_members
  ) {
    return res.status(400).send("0이상의 숫자를 입력하세요.");
  }
  db.query(
    query,
    [target_amount_month, target_amount_year, target_members, center_id],
    (err, result) => {
      if (err) {
        return res.status(500).json(err);
      }
      res.json({ message: "Updated the center", result: result });
    }
  );
};

//센터 회원수 알기
exports.getCenterCount = (req, res) => {
  const { center_id, usr_role } = req.query;
  const query =
    usr_role === "admin"
      ? `SELECT * FROM members 
        INNER JOIN member_orders ON member_orders.memo_mem_id = members.mem_id 
        LEFT JOIN products ON member_orders.memo_pro_id = products.pro_id 
        WHERE members.mem_status = 1 
        AND CURDATE() BETWEEN member_orders.memo_start_date AND member_orders.memo_end_date
        AND (
          products.pro_type != '회차권' 
          OR (products.pro_type = '회차권' AND member_orders.memo_remaining_counts > 0)
        );`
      : `SELECT * FROM members 
        INNER JOIN member_orders ON member_orders.memo_mem_id = members.mem_id 
        LEFT JOIN products ON member_orders.memo_pro_id = products.pro_id 
        WHERE members.center_id = ? AND members.mem_status = 1 
        AND CURDATE() BETWEEN member_orders.memo_start_date AND member_orders.memo_end_date
        AND (
          products.pro_type != '회차권' 
          OR (products.pro_type = '회차권' AND member_orders.memo_remaining_counts > 0)
        );`;
  db.query(query, [center_id], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

exports.getCenterList = (req, res) => {
  const { usr_role } = req.query;

  if (usr_role !== "admin") {
    return res.status(400).json({ result: "fail" });
  }

  const query = `
    SELECT
      c.center_id
      , c.center_name
      , COALESCE(
                  SUM(
                      CASE 
                        WHEN  YEAR(o.memo_purchase_date) = YEAR(CURRENT_DATE) AND o.memo_status = 1
                        THEN  o.memo_pro_price
                        ELSE 0
                      END
                    ), 0) AS annual_sales
      , COALESCE(
                  SUM(
                      CASE
                        WHEN  YEAR(o.memo_purchase_date) = YEAR(CURRENT_DATE)
                              AND MONTH(o.memo_purchase_date) = MONTH(CURRENT_DATE) 
                              AND o.memo_status = 1
                        THEN o.memo_pro_price
                        ELSE 0
                      END
                    ), 0) AS monthly_sales
    FROM      centers c
    LEFT JOIN member_orders o ON c.center_id = o.center_id
    GROUP BY  c.center_id, c.center_name
    ORDER BY  c.center_id DESC
  `;
  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

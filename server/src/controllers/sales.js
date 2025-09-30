const db = require("./../../db");
const dayjs = require("dayjs");

//매출 보기
exports.getSales = (req, res) => {
  const { center_id, usr_role } = req.query;
  const currentYear = dayjs().format().slice(0, 4);
  const current = dayjs().format().slice(0, 7);

  const query =
    usr_role === "admin"
      ? `
          SELECT
            (
              SELECT SUM(
                          CASE
                            WHEN  member_orders.memo_status = 1 THEN  memo_pro_price
                            ELSE  0
                          END
                        )
          FROM        member_orders
          INNER JOIN  products  ON  member_orders.memo_pro_id = products.pro_id
          INNER JOIN  members   ON  member_orders.memo_mem_id = members.mem_id
          WHERE       member_orders.memo_purchase_date LIKE '%${currentYear}%') AS total_sum_year,
                      (
                        SELECT
                          SUM(
                              CASE
                                WHEN  member_orders.memo_status = 1 THEN memo_pro_price
                                ELSE  0
                              END
                              )
                        FROM        member_orders
                        INNER JOIN  products  ON member_orders.memo_pro_id = products.pro_id
                        INNER JOIN  members   ON member_orders.memo_mem_id = members.mem_id
                        WHERE       member_orders.memo_purchase_date LIKE '%${current}%') AS total_sum_month;`
      : `
          SELECT
            (
              SELECT
                SUM(
                    CASE
                      WHEN  member_orders.memo_status = 1 THEN memo_pro_price
                      ELSE  0
                    END
                  )
          FROM        member_orders
          INNER JOIN  products  ON member_orders.memo_pro_id = products.pro_id
          INNER JOIN  members   ON member_orders.memo_mem_id = members.mem_id
          WHERE       products.center_id = ?
          AND         member_orders.memo_purchase_date LIKE '%${currentYear}%') AS total_sum_year,
                      (
                        SELECT
                          SUM(
                              CASE
                                WHEN  member_orders.memo_status = 1 THEN memo_pro_price ELSE 0 END)
                        FROM        member_orders
                        INNER JOIN  products  ON member_orders.memo_pro_id = products.pro_id
                        INNER JOIN  members   ON member_orders.memo_mem_id = members.mem_id
                        WHERE       products.center_id = ? 
                        AND         member_orders.memo_purchase_date LIKE '%${current}%') AS total_sum_month
          ;
        `;
  db.query(query, [center_id, center_id], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

exports.getYearlySales = (req, res) => {
  const { center_id, usr_role } = req.query;
  const query =
    usr_role === "admin"
      ? `
          SELECT
            CONCAT(YEAR(member_orders.memo_purchase_date), '-', LPAD(MONTH(member_orders.memo_purchase_date), 2, '0')) AS sales_date 
            , SUM(
                  CASE
                    WHEN member_orders.memo_status = 1 THEN memo_pro_price
                    ELSE 0
                  END
                ) AS totalSales
            , YEAR(member_orders.memo_purchase_date) AS sales_year
          FROM        member_orders
          INNER JOIN  products ON member_orders.memo_pro_id = products.pro_id
          GROUP BY    sales_year, sales_date;`
      : `
          SELECT
            CONCAT(YEAR(member_orders.memo_purchase_date), '-', LPAD(MONTH(member_orders.memo_purchase_date), 2, '0')) AS sales_date
            , SUM(
                  CASE
                    WHEN member_orders.memo_status = 1 THEN memo_pro_price
                    ELSE 0
                  END
                ) AS totalSales
            , YEAR(member_orders.memo_purchase_date) AS sales_year
          FROM        member_orders
          INNER JOIN  products  ON member_orders.memo_pro_id = products.pro_id 
          WHERE       products.center_id = ?
          GROUP BY    sales_year, sales_date;`;
  db.query(query, [center_id], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

exports.getMonthlySales = (req, res) => {
  const { center_id, usr_role } = req.query.user;
  const { path } = req.query;

  const query =
    usr_role === "admin"
      ? `
          SELECT
            *
          FROM        member_orders
          INNER JOIN  products  ON member_orders.memo_pro_id = products.pro_id
          INNER JOIN  members   ON member_orders.memo_mem_id = members.mem_id
          INNER JOIN  centers   ON members.center_id = centers.center_id
          WHERE       member_orders.memo_status = 1
          AND         member_orders.memo_purchase_date LIKE '%${path}%' 
          ORDER BY memo_purchase_date DESC
          ;
        `
      : `
          SELECT
            *
          FROM        member_orders
          INNER JOIN  products  ON member_orders.memo_pro_id = products.pro_id
          INNER JOIN  members   ON member_orders.memo_mem_id = members.mem_id
          WHERE       products.center_id = ?
          AND         member_orders.memo_status = 1
          AND         member_orders.memo_purchase_date LIKE '%${path}%'
          ORDER BY memo_purchase_date DESC;`;
  db.query(query, [center_id], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

exports.getReRegisterSales = (req, res) => {
  const { center_id, usr_role } = req.query.user;
  const { path } = req.query;

  const query =
    usr_role === "admin"
      ? `
          SELECT
            m.mem_id
            , m.mem_name
            , mo.memo_id
            , mo.memo_pro_name
            , mo.memo_pro_price
            , mo.memo_start_date
            , mo.memo_end_date
            , mo.memo_purchase_date
            , (
                SELECT
                  center_name
                FROM  centers
                WHERE center_id = m.center_id
              ) AS center_name
          FROM		        members m
          INNER JOIN 	    member_orders mo ON m.mem_id = mo.memo_mem_id
          WHERE 		      mo.memo_purchase_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
          AND             mo.memo_status = 1
          AND EXISTS	    (
                            SELECT
                              1
                            FROM	member_orders smof
                            WHERE smof.memo_mem_id = mo.memo_mem_id
                            AND 	smof.memo_purchase_date < mo.memo_purchase_date
                          )
          AND NOT EXISTS  (
                            SELECT
                              1
                            FROM	member_orders smos
                            WHERE smos.memo_mem_id = mo.memo_mem_id
                            AND 	smos.memo_purchase_date > mo.memo_purchase_date
                            AND 	smos.memo_purchase_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
                          )
          AND             mo.memo_purchase_date LIKE '%${path}%' 
          ORDER BY mo.memo_purchase_date DESC
          ;
        `
      : `
          SELECT
            m.mem_id
            , m.mem_name
            , mo.memo_pro_name
            , mo.memo_pro_price
            , mo.memo_start_date
            , mo.memo_end_date
            , mo.memo_purchase_date
          FROM		        members m
          INNER JOIN      member_orders mo ON m.mem_id = mo.memo_mem_id
          WHERE 		      mo.memo_purchase_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
          AND             mo.memo_status = 1
          AND EXISTS	    (
                            SELECT
                              1
                            FROM	member_orders smof
                            WHERE smof.memo_mem_id = mo.memo_mem_id
                            AND 	smof.memo_purchase_date < mo.memo_purchase_date
                          )
          AND NOT EXISTS  (
                            SELECT
                              1
                            FROM	member_orders smos
                            WHERE smos.memo_mem_id = mo.memo_mem_id
                            AND 	smos.memo_purchase_date > mo.memo_purchase_date
                            AND 	smos.memo_purchase_date >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
                          )
          AND			        m.center_id = ?
          AND             mo.memo_purchase_date LIKE '%${path}%' 
          ORDER BY mo.memo_purchase_date DESC
        `;
  db.query(query, [center_id], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

//매출 삭제
exports.deleteSales = (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM member_orders WHERE memo_id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.json({ message: "Deleted the schedule.", result: result });
  });
};

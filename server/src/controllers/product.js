const db = require("./../../db");

//회원권 보기
exports.getProduct = (req, res) => {
  const { center_id } = req.query;
  const query = "SELECT * FROM products WHERE center_id = ? AND pro_status = 1";
  db.query(query, [center_id], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

//회원권 추가
exports.createProduct = (req, res) => {
  const {
    pro_name,
    pro_type,
    pro_months,
    pro_week,
    pro_remaining_counts,
    pro_price,
    pro_class,
  } = req.body[0];
  const center_id = req.body[1];
  const remainingCount = pro_type === "회차권" ? pro_remaining_counts : null;
  const query = `INSERT INTO products (pro_name, pro_type, pro_months, pro_week, pro_remaining_counts, pro_price, pro_class, center_id, pro_status) VALUES (?,?,?,?,?,?,?,?,?)`;
  db.query(
    query,
    [
      pro_name,
      pro_type,
      pro_months,
      pro_week,
      remainingCount,
      pro_price,
      pro_class,
      center_id,
      1,
    ],
    (err, result) => {
      if (err) {
        res.status(500).json(err);
      }
      res.status(201).json({ result: result });
    }
  );
};

//회원권 변경
exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const {
    pro_name,
    pro_type,
    pro_months,
    pro_week,
    pro_remaining_counts,
    pro_price,
    pro_class,
  } = req.body;
  const query = `UPDATE products SET pro_name = ?, pro_type = ?, pro_months = ?, pro_week = ?, pro_remaining_counts = ?, pro_price = ?, pro_class = ? WHERE pro_id = ?`;
  db.query(
    query,
    [
      pro_name,
      pro_type,
      pro_months,
      pro_week,
      pro_remaining_counts,
      pro_price,
      pro_class,
      id,
    ],
    (err, result) => {
      if (err) {
        res.status(500).json(err);
      }
      res.json({ message: "Updated the product", result: result });
    }
  );
};

//회원권 삭제
exports.deleteProduct = (req, res) => {
  const { id } = req.params;
  const query = "UPDATE products SET pro_status = 0 WHERE pro_id = ?";
  db.query(query, [id], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.json({ message: "Deleted the product.", result: result });
  });
};

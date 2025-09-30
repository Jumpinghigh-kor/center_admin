const db = require("./../../db");

exports.getVideo = (req, res) => {
  const { pl_type } = req.body;
  const query = `SELECT * FROM playlist WHERE pl_type = ?`;

  db.query(query, [pl_type], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(201).json({ result: result });
  });
};

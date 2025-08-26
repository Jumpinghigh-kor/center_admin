const db = require("./../../db");

exports.getVideo = (req, res) => {
  const query = `SELECT * FROM playlist LIMIT 1`;

  db.query(query, (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(201).json({ result: result });
  });
};

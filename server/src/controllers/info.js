const db = require("./../../db");

exports.getInfo = (req, res) => {
  const getUpdateLogQuery =
    "SELECT * FROM update_log ORDER BY up_id DESC LIMIT 3;";
  const getNoticeQuery = "SELECT * FROM notices ORDER BY no_id DESC LIMIT 3;";
  const getGuidelineQuery =
    "SELECT * FROM guidelines ORDER BY gl_id DESC LIMIT 3;";
  db.query(getUpdateLogQuery, (err1, result1) => {
    if (err1) {
      return res.status(500).json(err1);
    }
    db.query(getNoticeQuery, (err2, result2) => {
      if (err2) {
        return res.status(500).json(err2);
      }
      db.query(getGuidelineQuery, (err3, result3) => {
        if (err3) {
          return res.status(500).json(err3);
        }
        res.status(200).json({
          updateLog: result1,
          notice: result2,
          guideline: result3,
        });
      });
    });
  });
};

exports.getInfoWithoutLimit = (req, res) => {
  const getUpdateLogQuery = "SELECT * FROM update_log ORDER BY up_id DESC";
  const getNoticeQuery = "SELECT * FROM notices ORDER BY no_id DESC";
  const getGuidelineQuery = "SELECT * FROM guidelines ORDER BY gl_id DESC;";
  db.query(getUpdateLogQuery, (err1, result1) => {
    if (err1) {
      return res.status(500).json(err1);
    }
    db.query(getNoticeQuery, (err2, result2) => {
      if (err2) {
        return res.status(500).json(err2);
      }
      db.query(getGuidelineQuery, (err3, result3) => {
        if (err3) {
          return res.status(500).json(err3);
        }
        res.status(200).json({
          updateLog: result1,
          notice: result2,
          guideline: result3,
        });
      });
    });
  });
};

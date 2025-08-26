const db = require("./../../db");

exports.saveAnswer = (req, res) => {
  const { answer } = req.body;
  const { inq_id, inq_title, center_id } = req.body.inquiry;
  const saveReplyQuery = `
  INSERT INTO inquiry_reply (inq_id, reply_body, center_id) VALUES (?,?,?);
  `;
  const updateInquiryQuery = `UPDATE inquiry SET is_responded = 1 WHERE inq_id = ?;`;
  db.query(saveReplyQuery, [inq_id, answer, center_id], (err) => {
    if (err) {
      return res.status(500).json(err);
    }
    db.query(updateInquiryQuery, [inq_id]);
    const query = `INSERT INTO notifications 
    (not_user_id, not_type, not_title, not_message) VALUES (?, ?, ?, ?)`;
    const type = "답변 알림";
    const title = "답변 완료 알림";
    const message = `💡알림! 회원님의 🔥${inq_title}🔥 문의에 답변이 달렸습니다.`;
    db.query(query, [center_id, type, title, message], (err, result) => {
      if (err) {
        return res.status(500).json(err);
      }
      return res.status(200).json({ result: result });
    });
  });
};

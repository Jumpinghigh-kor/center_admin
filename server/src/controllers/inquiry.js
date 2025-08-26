const db = require("./../../db");
const dayjs = require("dayjs");

//문의보기
exports.getInquiry = (req, res) => {
  const { center_id, usr_role } = req.query;
  const query =
    usr_role === "admin"
      ? "SELECT * FROM inquiry INNER JOIN centers ON inquiry.center_id = centers.center_id ORDER BY inq_regist_date DESC"
      : "SELECT * FROM inquiry WHERE center_id = ? ORDER BY inq_regist_date DESC";
  db.query(query, [center_id], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 답변 보기
exports.getInquiryDetail = (req, res) => {
  const { inquiryId } = req.params;
  const query = `SELECT * FROM inquiry 
  INNER JOIN inquiry_reply ON inquiry.inq_id = inquiry_reply.inq_id 
  WHERE inquiry.inq_id = ? ORDER BY inq_regist_date DESC;`;
  db.query(query, [inquiryId], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 추가문의 보기
exports.getInquiryAddDetail = (req, res) => {
  const { inquiryId } = req.params;
  const query = `
          SELECT
            i.inq_id
            , i.inq_title
            , i.inq_body
            , ia.inq_id
            , ia.content
            , ia.inq_add_dt
          FROM 		    inquiry i
          INNER JOIN	inquiry_add   ia ON i.inq_id = ia.inq_id
          WHERE		    i.inq_id = ?
          ORDER BY 	  i.inq_regist_date DESC
        `;
  db.query(query, [inquiryId], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 추가 문의 등록
exports.createInquiryAdd = (req, res) => {
  const { inq_id, content } = req.body;
  const inq_add_dt = dayjs().format("YYYY-MM-DD HH:mm:ss");

  const query = `INSERT INTO inquiry_add (inq_id, content, inq_add_dt) VALUES (?, ?, ?)`;

  db.query(query, [inq_id, content, inq_add_dt], (err, result) => {
    if (err) {
      console.log("err", err);
      return res.status(500).json({ error: err });
    }
    res.status(201).json({ result: result });
  });
};

//문의하기
exports.createInquiry = (req, res) => {
  const { title, body, center_id, version } = req.body;
  const time = dayjs().format("YYYY-MM-DD HH:mm:ss");
  const query = `INSERT INTO inquiry (inq_title, inq_body, inq_regist_date, web_version, center_id) VALUES (?,?,?,?,?)`;
  db.query(query, [title, body, time, version, center_id], (err, result) => {
    if (err) {
      console.log("err", err);
    }
    res.status(201).json({ result: result });
  });
};

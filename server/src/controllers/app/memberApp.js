const db = require("../../../db");
const dayjs = require("dayjs");

// 어플 회원 목록 조회
exports.selectMemberAppList = (req, res) => {
    const { mem_name, center_id } = req.body;

    let addCondition = '';
    let params = [];
  
    if(center_id) {
      addCondition += ` AND c.center_id = ?`;
      params.push(center_id);
    }

    if(mem_name) {
      addCondition += ` AND m.mem_name LIKE CONCAT('%', ?, '%')`;
      params.push(mem_name);
    }
    
    const query = `
      SELECT
        c.center_id
        , c.center_name
        , m.mem_id
        , m.mem_name
        , m.mem_phone
        , CASE
            WHEN m.mem_gender = 0 THEN '여자'
            ELSE '남자'
        END AS mem_gender
        , m.mem_app_status
      FROM		  centers c
      LEFT JOIN	members m ON c.center_id = m.center_id
      WHERE		  m.mem_app_status = 'ACTIVE'
      ${addCondition}
      ORDER BY	  c.center_id DESC
    `;
    
    db.query(query, params, (err, result) => {
      if (err) {
        res.status(500).json(err);
      }
      res.status(200).json({ result: result });
    });
  };
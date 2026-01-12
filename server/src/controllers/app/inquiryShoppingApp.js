const db = require("../../../db");
const dayjs = require("dayjs");

// 쇼핑몰 문의 목록 조회
exports.selectInquiryShoppingAppList = (req, res) => {
  const { center_id, memName, productName } = req.body;
  
  let query = `
    SELECT
      m.mem_id
      , m.mem_name
      , maa.account_app_id
      , isa.inquiry_shopping_app_id
      , isa.content
      , DATE_FORMAT(isa.reg_dt, '%Y-%m-%d %H:%i:%s')  AS reg_dt
      , pa.product_name
      , pa.inquiry_phone_number
    FROM		    members m
    INNER JOIN  member_account_app maa    ON m.mem_id = maa.mem_id
    INNER JOIN	inquiry_shopping_app isa  ON maa.account_app_id = isa.account_app_id
    LEFT JOIN   product_app pa            ON isa.product_app_id = pa.product_app_id
    WHERE		    isa.del_yn = 'N'
    AND			    m.center_id = ?
  `;

  const params = [center_id];

  // 검색 조건 추가
  if (memName && memName !== '') {
    query += ` AND m.mem_name LIKE ?`;
    params.push(`%${memName}%`);
  }

  if (productName && productName !== '') {
    query += ` AND pa.product_name LIKE ?`;
    params.push(`%${productName}%`);
  }

  query += ` ORDER BY isa.inquiry_shopping_app_id DESC`;

  db.query(query, params, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};
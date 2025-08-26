const db = require("../../../db");
const dayjs = require("dayjs");

// 주문 주소지 조회
exports.selectMemberOrderAddress = (req, res) => {
  const { center_id } = req.body;
  
  let query = `
      SELECT
        moa.order_app_id
        , moda.order_detail_app_id
        , moad.receiver_name
        , moad.receiver_phone
        , moad.address
        , moad.address_detail
        , moad.zip_code
        , moad.enter_way
        , moad.enter_memo
        , moad.delivery_request
        , moad.use_yn
        , (
          SELECT
            zip_code
          FROM	extra_shipping_area sesa
          WHERE	sesa.zip_code = moad.zip_code
       ) AS extra_zip_code
      FROM		  members m
      LEFT JOIN	member_order_app moa		      ON m.mem_id = moa.mem_id
      LEFT JOIN	member_order_detail_app moda	ON moa.order_app_id = moda.order_app_id
      LEFT JOIN	member_order_address moad		  ON moda.order_detail_app_id = moad.order_detail_app_id
      WHERE		  m.center_id = ?
      AND			  moa.del_yn = 'N'
      AND			  moad.use_yn = 'Y'
  `;

  db.query(query, [center_id], (err, result) => {
    if (err) {
      console.error('selectMemberOrderAddress error:', err);
      return res.status(500).json({ error: '주문 주소 조회 중 오류가 발생했습니다.' });
    }
    return res.status(200).json({ result });
  });
};

// 배송지 변경
exports.updateMemberOrderAddress = (req, res) => {
  try {
    const { order_address_id, receiver_name, receiver_phone, address, address_detail, zip_code, userId } = req.body;

    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    const updateMemberOrderAddressQuery = `
      UPDATE member_order_address SET
        receiver_name
        , receiver_phone
        , address
        , address_detail
        , zip_code
        , mod_dt
        , mod_id
      WHERE order_address_id = ?
    `;

    db.query(
      updateMemberOrderAddressQuery,
      [receiver_name, receiver_phone, address, address_detail, zip_code, mod_dt, userId, order_address_id],
      (err, result) => {
        if (err) {
          console.error("배송지 변경 오류:", err);
          return res
            .status(500)
            .json({ error: "배송지 변경 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "배송지가 성공적으로 변경되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("배송지 변경 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};
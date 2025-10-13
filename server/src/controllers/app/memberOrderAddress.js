const db = require("../../../db");
const dayjs = require("dayjs");

// 주문 주소지 조회
exports.selectMemberOrderAddress = (req, res) => {
  const { center_id } = req.body;
  
  let query = `
      SELECT
        moa.order_app_id
        , moad.order_detail_app_id
        , moad.order_address_type
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

// 배송지 삭제
exports.deleteMemberOrderAddress = (req, res) => {
  try {
    const { order_address_id, userId } = req.body;

    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    const deleteMemberOrderAddressQuery = `
      UPDATE member_order_address SET
        use_yn = 'N'
        , mod_dt = ?
        , mod_id = ?
      WHERE order_address_id IN (?)
    `;

    db.query(
      deleteMemberOrderAddressQuery,
      [mod_dt, userId, order_address_id],
      (err, result) => {
        if (err) {
          console.error("배송지 삭제 오류:", err);
          return res
            .status(500)
            .json({ error: "배송지 삭제 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "배송지가 성공적으로 삭제되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("배송지 삭제 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 회원 주문 주소지 등록
exports.insertMemberOrderAddress = (req, res) => {
  try {
    const { order_detail_app_id, order_address_type, mem_id, receiver_name, receiver_phone, address, address_detail, zip_code, enter_way, enter_memo, delivery_request, use_yn } = req.body;
    
    // 현재 날짜 형식화
    const now = dayjs();
    const reg_dt = now.format("YYYYMMDDHHmmss");
    const mod_dt = reg_dt;

    // 동일 상세의 기존 활성 주소 비활성화(use_yn='N')
    const deactivatePrevQuery = `
      UPDATE member_order_address SET
        use_yn = 'N'
        , mod_dt = ?
        , mod_id = ?
      WHERE order_detail_app_id = ?
      AND   use_yn = 'Y'
    `;

    // member_order_address 테이블에 주문 주소지 직접 등록 (프런트 orderDetail 값 사용)
    const insertAddressQuery = `
      INSERT INTO member_order_address (
        order_detail_app_id
        , order_address_type
        , mem_id
        , receiver_name
        , receiver_phone
        , address
        , address_detail
        , zip_code
        , enter_way
        , enter_memo
        , delivery_request
        , use_yn
        , reg_dt
        , reg_id
        , mod_dt
        , mod_id
      ) VALUES (
        ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , NULL
        , NULL
      )
    `;

    db.query(
      deactivatePrevQuery,
      [mod_dt, mem_id, order_detail_app_id],
      (deErr) => {
        if (deErr) {
          console.error('기존 주소 비활성화 오류:', deErr);
          return res.status(500).json({ error: '기존 주소 비활성화 중 오류가 발생했습니다.' });
        }

        // 1순위: 동일 상세의 최초 ORDER 주소 복사 시도
        const tryCopyOriginalOrderQuery = `
          INSERT INTO member_order_address (
            order_detail_app_id
            , order_address_type
            , mem_id
            , receiver_name
            , receiver_phone
            , address
            , address_detail
            , zip_code
            , enter_way
            , enter_memo
            , delivery_request
            , use_yn
            , reg_dt
            , reg_id
            , mod_dt
            , mod_id
          )
          SELECT
            ?
            , 'ORDER'
            , COALESCE(moad.mem_id, ?)
            , COALESCE(moad.receiver_name, '')
            , COALESCE(moad.receiver_phone, '')
            , COALESCE(moad.address, '')
            , COALESCE(moad.address_detail, '')
            , COALESCE(moad.zip_code, '')
            , moad.enter_way
            , moad.enter_memo
            , moad.delivery_request
            , 'Y'
            , ?
            , ?
            , NULL
            , NULL
          FROM member_order_address moad
          WHERE moad.order_detail_app_id = ?
          AND   moad.order_address_type = 'ORDER'
          ORDER BY moad.order_address_id ASC
          LIMIT 1
        `;

        const proceedDirectInsert = () => {
          db.query(
            insertAddressQuery,
            [
              order_detail_app_id,
              order_address_type,
              mem_id,
              receiver_name || '',
              receiver_phone || '',
              address || '',
              address_detail || '',
              zip_code || '',
              enter_way || null,
              enter_memo || null,
              delivery_request || null,
              use_yn || 'Y',
              reg_dt,
              mem_id,
            ],
            (err, result) => {
              if (err) {
                console.error("주문 주소지 등록 오류:", err);
                return res
                  .status(500)
                  .json({ error: "주문 주소지 등록 중 오류가 발생했습니다." });
              }
              return res.status(201).json({ order_address_id: result.insertId, success: true });
            }
          );
        };

        if (String(order_address_type || '').toUpperCase() === 'ORDER') {
          db.query(
            tryCopyOriginalOrderQuery,
            [order_detail_app_id, mem_id, reg_dt, mem_id, order_detail_app_id],
            (copyErr, copyRes) => {
              if (copyErr) {
                console.error('최초 ORDER 주소 복사 오류:', copyErr);
                return proceedDirectInsert();
              }
              const affected = copyRes && copyRes.affectedRows ? copyRes.affectedRows : 0;
              if (affected > 0) {
                return res.status(201).json({ order_address_id: copyRes.insertId, success: true });
              }
              return proceedDirectInsert();
            }
          );
        } else {
          proceedDirectInsert();
        }
      }
    );
  } catch (error) {
    console.error("주문 주소지 등록 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};
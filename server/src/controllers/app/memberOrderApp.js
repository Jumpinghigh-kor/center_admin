const db = require("../../../db");
const dayjs = require("dayjs");

// 회원 주문 목록 조회
exports.selectMemberOrderAppList = (req, res) => {
  const { order_status, center_id, searchValue } = req.body;
  
  let filter = '';
  if (order_status && order_status !== 'TOTAL_COUNT') {
    filter = `AND moda.order_status = ?`
  }

  if (searchValue) {
    const searchFilter = `
              AND (m.mem_name LIKE CONCAT('%', ?, '%')
              OR  m.mem_phone LIKE CONCAT('%', ?, '%')
              OR  CONCAT(moa.order_dt, moa.order_app_id) LIKE CONCAT('%', ?, '%')
              OR  (moda.tracking_number LIKE CONCAT('%', ?, '%') 
                  OR mra.company_tracking_number LIKE CONCAT('%', ?, '%')
                  OR mra.customer_tracking_number LIKE CONCAT('%', ?, '%') ))`;
    
    if (order_status && order_status !== 'TOTAL_COUNT') {
      filter += ` ${searchFilter}`;
    } else {
      filter = searchFilter;
    }
  }

  const query = `
      SELECT
        m.mem_id
        , m.mem_name
        , m.mem_birth
        , m.mem_phone
        , m.mem_email_id
        , moa.order_app_id
        , moa.mem_id
        , moa.order_dt
        , moa.order_memo
        , DATE_FORMAT(moa.order_memo_dt, '%Y-%m-%d %H:%i:%s') AS order_memo_dt
        , moa.memo_check_yn
        , moa.memo_del_yn
        , moa.del_yn
        , moa.reg_dt
        , moda.order_detail_app_id
        , moda.order_status
        , moda.order_quantity
        , moda.courier_code AS order_courier_code
        , moda.tracking_number
        , moda.order_group
        , moda.goodsflow_id
        , pa.product_app_id
        , pa.brand_name
        , pa.product_name
        , pa.price
        , pa.original_price
        , pa.discount
        , pa.give_point
        , pa.courier_code
        , pa.free_shipping_amount
        , pa.remote_delivery_fee
        , pa.delivery_fee
        , pda.product_detail_app_id
        , pda.option_type
        , pda.option_amount
        , pda.option_unit
        , pda.option_gender
        , pda.quantity
        , mra.return_app_id
        , mra.approval_yn
        , mra.cancel_yn
        , mra.return_reason_type
        , mra.quantity
        , mra.customer_tracking_number
        , mra.company_tracking_number
        , mra.customer_courier_code
        , mra.company_courier_code
        , mra.quantity AS return_quantity
        , mra.return_goodsflow_id
        , CASE
            WHEN mra.return_applicator = 'ADMIN' THEN '판매자'
            ELSE '구매자'
          END AS return_applicator
        , mra.reg_dt AS return_dt
        , (
            SELECT
              smpa.payment_app_id
            FROM	member_payment_app	smpa
            WHERE	smpa.order_app_id = moa.order_app_id
            AND		smpa.payment_type = 'DELIVERY_FEE'
          ) AS delivery_fee_payment_app_id
        , (
            SELECT
              SUM(smpa.payment_amount) - IFNULL(SUM(smpa.refund_amount), 0)
            FROM	member_payment_app	smpa
            WHERE	smpa.order_app_id = moa.order_app_id
            AND		smpa.payment_type = 'PRODUCT_BUY'
          ) AS payment_amount
        , (
            SELECT
              IFNULL(SUM(smpa.refund_amount), 0)
            FROM	member_payment_app	smpa
            WHERE	smpa.order_app_id = moa.order_app_id
            AND		smpa.payment_type = 'PRODUCT_BUY'
          ) AS refund_amount
        , (
            SELECT
              IFNULL(SUM(smpa.point_amount), 0)
            FROM	member_point_app	smpa
            WHERE	smpa.order_app_id = moa.order_app_id
            AND		smpa.del_yn = 'N'
            AND		smpa.point_status = 'POINT_MINUS'
          ) AS point_use_amount
        , (
            SELECT
              smpa.portone_imp_uid
            FROM	member_payment_app	smpa
            WHERE	smpa.order_app_id = moa.order_app_id
            AND		smpa.payment_type = 'PRODUCT_BUY'
          ) AS portone_imp_uid
        , (
            SELECT
              smpa.portone_merchant_uid
            FROM	member_payment_app	smpa
            WHERE	smpa.order_app_id = moa.order_app_id
            AND		smpa.payment_type = 'PRODUCT_BUY'
          ) AS portone_merchant_uid
        , (
            SELECT
              SUM(smpa.payment_amount)
            FROM	member_payment_app	smpa
            WHERE	smpa.order_app_id = moa.order_app_id
            AND		smpa.payment_type = 'DELIVER_FEE'
          ) AS delivery_fee_payment_amount
        , (
            SELECT
              smpa.portone_imp_uid
            FROM	member_payment_app	smpa
            WHERE	smpa.order_app_id = moa.order_app_id
            AND		smpa.payment_type = 'DELIVERY_FEE'
          ) AS delivery_fee_portone_imp_uid
        , (
            SELECT
              smpa.portone_imp_uid
            FROM	member_payment_app	smpa
            WHERE	smpa.order_app_id = moa.order_app_id
            AND		smpa.payment_type = 'DELIVERY_FEE'
          ) AS delivery_fee_portone_imp_uid
        , (
            SELECT
              smpa.portone_merchant_uid
            FROM	member_payment_app	smpa
            WHERE	smpa.order_app_id = moa.order_app_id
            AND		smpa.payment_type = 'DELIVERY_FEE'
          ) AS delivery_fee_portone_merchant_uid
        , (
            SELECT
              CASE
                WHEN smpa.card_name = 'kakaopay' THEN '카카오페이'
                ELSE smpa.card_name
              END AS card_name
            FROM	member_payment_app	smpa
            WHERE	smpa.order_app_id = moa.order_app_id
            ORDER BY smpa.payment_app_id ASC
            LIMIT 1
          ) AS card_name
      FROM		    members m
      INNER JOIN	member_order_app moa			    ON m.mem_id = moa.mem_id
      LEFT JOIN	  member_order_detail_app moda	ON moa.order_app_id = moda.order_app_id
      LEFT JOIN   product_detail_app pda      	ON moda.product_detail_app_id = pda.product_detail_app_id
      LEFT JOIN   product_app pa              	ON pda.product_app_id = pa.product_app_id
      LEFT JOIN	  member_return_app mra			    ON moda.order_detail_app_id = mra.order_detail_app_id
      WHERE       moa.del_yn = 'N'
      AND         m.center_id = ?
      ${filter}
      ORDER BY moa.order_dt DESC
    ;`;
    
    let queryParams = [center_id];
    
    if (order_status && order_status !== 'TOTAL_COUNT') {
      queryParams.push(order_status);
    }
    
    if (searchValue) {
      for (let i = 0; i < 6; i++) {
        queryParams.push(searchValue);
      }
    }

    db.query(query, queryParams, (err, result) => {
    if (err) {
      console.error("주문 목록 조회 오류:", err);
      return res.status(500).json({ error: "주문 목록을 조회하는 도중 오류가 발생했습니다." });
    }
    res.status(200).json(result);
  });
};

// 회원 주문 목록 갯수 조회
exports.selectMemberOrderAppCount = (req, res) => {
  const { center_id } = req.body;
  
  const query = `
      SELECT
        COUNT(DISTINCT moa.order_app_id) AS TOTAL_COUNT
        , COUNT(DISTINCT CASE WHEN moda.order_status = 'PAYMENT_COMPLETE'   THEN moa.order_app_id END) AS PAYMENT_COMPLETE
        , COUNT(DISTINCT CASE WHEN moda.order_status = 'SHIPPINGING'        THEN moa.order_app_id END) AS SHIPPINGING
        , COUNT(DISTINCT CASE WHEN moda.order_status = 'SHIPPING_COMPLETE'  THEN moa.order_app_id END) AS SHIPPING_COMPLETE
        , COUNT(DISTINCT CASE WHEN moda.order_status = 'RETURN_APPLY'       THEN moa.order_app_id END) AS RETURN_APPLY
        , COUNT(DISTINCT CASE WHEN moda.order_status = 'EXCHANGE_APPLY'     THEN moa.order_app_id END) AS EXCHANGE_APPLY
        , COUNT(DISTINCT CASE WHEN moda.order_status = 'CANCEL_APPLY'       THEN moa.order_app_id END) AS CANCEL_APPLY
        , COUNT(DISTINCT CASE WHEN moda.order_status = 'HOLD'               THEN moa.order_app_id END) AS HOLD
        , COUNT(DISTINCT CASE WHEN moda.order_status = 'PURCHASE_CONFIRM'   THEN moa.order_app_id END) AS PURCHASE_CONFIRM
      FROM        members m
      INNER JOIN  member_order_app moa          ON m.mem_id = moa.mem_id
      LEFT JOIN   member_order_detail_app moda  ON moda.order_app_id = moa.order_app_id
      WHERE       m.center_id = ?
      AND         moa.del_yn = 'N'
    ;`;
    
  db.query(query, [center_id], (err, result) => {
    if (err) {
      console.error("주문 목록 갯수 조회 오류:", err);
      return res.status(500).json({ error: "주문 목록 갯수를 조회하는 도중 오류가 발생했습니다." });
    }
    res.status(200).json(result);
  });
};

// 상품 이미지 조회
exports.selectProductAppImg = (req, res) => {
  const { product_app_id } = req.body;

  const query = `
      SELECT
        cf.file_id
        , cf.file_path
        , cf.file_name
        , cf.file_division
        , pa.product_app_id
        , pai.product_app_img_id
        , pai.order_seq
        , pai.img_form
      FROM		  product_app pa
      LEFT JOIN	product_app_img pai ON pa.product_app_id = pai.product_app_id
      LEFT JOIN	common_file cf 		  ON pai.file_id = cf.file_id
      WHERE			cf.del_yn = 'N'
      AND			  pai.img_form = 'REPRESENTER'
      AND			  pai.del_yn = 'N'
  `;

  db.query(query, [product_app_id], (err, result) => {
    if (err) {
      console.error("상품 이미지 조회 오류:", err);
    }
    res.status(200).json(result);
  });
};

// 회원 주문 등록
exports.insertMemberOrderApp = (req, res) => {
  try {
    const { payment_app_id, product_detail_app_id, mem_id, order_status, order_quantity, order_dt,  order_group } = req.body;
    
    // 현재 날짜 형식화
    const now = dayjs();
    const reg_dt = now.format("YYYYMMDDHHmmss");

    // member_order_app 테이블에 주문 정보 등록
    const memberOrderAppInsertQuery = `
      INSERT INTO member_order_app (
        mem_id
        , order_dt
        , order_memo
        , order_memo_dt
        , memo_check_yn
        , memo_del_yn
        , del_yn
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
      )
    `;

    db.query(
      memberOrderAppInsertQuery,
      [
        mem_id,
        order_dt,
        null,
        null,
        null,
        null,
        'N',
        reg_dt,
        mem_id,
        null,
        null,
      ],
      (err, result) => {
        if (err) {
          console.error("주문 정보 등록 오류:", err);
          return res
            .status(500)
            .json({ error: "주문 정보 등록 중 오류가 발생했습니다." });
        }
        res.status(201).json({
          memberOrderAppId: result.insertId,
        });
      }
    );
  } catch (error) {
    console.error("주문 정보 등록 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 회원 주문 상세 등록
exports.insertMemberOrderDetailApp = (req, res) => {
  try {
    const { order_app_id, product_detail_app_id, order_status, order_quantity, order_group, courier_code, tracking_number, goodsflow_id, userId } = req.body;

    // 현재 날짜 형식화
    const now = dayjs();
    const reg_dt = now.format("YYYYMMDDHHmmss");

    // member_order_app 테이블에 주문 정보 등록
    const memberOrderDetailAppInsertQuery = `
      INSERT INTO member_order_detail_app (
        order_app_id
        , product_detail_app_id
        , order_status
        , order_quantity
        , order_group
        , courier_code
        , tracking_number
        , goodsflow_id
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
      )
    `;

    db.query(
      memberOrderDetailAppInsertQuery,
      [
        order_app_id,
        product_detail_app_id,
        order_status,
        order_quantity,
        order_group,
        courier_code,
        tracking_number,
        goodsflow_id,
        reg_dt,
        userId,
        null,
        null,
      ],
      (err, result) => {
        if (err) {
          console.error("주문 상세 정보 등록 오류:", err);
          return res
            .status(500)
            .json({ error: "주문 상세 정보 등록 중 오류가 발생했습니다." });
        }
        res.status(201).json({
          memberOrderDetailAppId: result.insertId,
        });
      }
    );
  } catch (error) {
    console.error("주문 상세 정보 등록 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 주문 메모 수정
exports.updateMemberOrderAppMemo = (req, res) => {
  const { order_app_id, order_memo, userId, memo_check_yn, memo_del_yn } = req.body;
  const now = dayjs();
  const mod_dt = now.format("YYYYMMDDHHmmss");

  // 동적 쿼리 생성
  let setClause = [];
  let queryParams = [];
  
  if (memo_check_yn !== undefined) {
    setClause.push("memo_check_yn = ?");
    queryParams.push(memo_check_yn);
  }
  
  if (order_memo !== undefined) {
    setClause.push("order_memo = ?");
    setClause.push("order_memo_dt = ?");
    setClause.push("memo_del_yn = 'N'");
    queryParams.push(order_memo, mod_dt);
  }

  if (memo_del_yn !== undefined) {
    setClause.push("memo_del_yn = ?");
    setClause.push("order_memo = NULL");
    setClause.push("order_memo_dt = NULL");
    queryParams.push(memo_del_yn);
  }
  
  // 공통 필드
  setClause.push("mod_dt = ?", "mod_id = ?");
  queryParams.push(mod_dt, userId);
  
  // WHERE 조건
  queryParams.push(order_app_id);
  
  const query = `
    UPDATE member_order_app SET
      ${setClause.join(", ")}
    WHERE order_app_id = ?
  `;
  
  db.query(query, queryParams, (err, result) => {
    if (err) {
      console.error("주문 메모 수정 오류:", err);
      return res.status(500).json({ error: "주문 메모를 수정하는 도중 오류가 발생했습니다." });
    }
    res.status(200).json({ message: "주문 메모가 성공적으로 수정되었습니다." });
  });
};

// 송장번호 입력
exports.updateTrackingNumber = (req, res) => {
  try {
    const { order_detail_app_id, tracking_number, order_status, userId, courier_code } = req.body;
    
    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    const updateTrackingNumberQuery = `
      UPDATE member_order_detail_app SET
        order_status = ?
        , courier_code = ?
        , tracking_number = ?
        , mod_dt = ?
        , mod_id = ?
      WHERE order_detail_app_id IN (?)
    `;

    db.query(
      updateTrackingNumberQuery,
      [order_status, courier_code, tracking_number, mod_dt, userId, order_detail_app_id],
      (err, result) => {
        if (err) {
          console.error("송장번호 입력 오류:", err);
          return res
            .status(500)
            .json({ error: "송장번호 입력 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "송장번호가 성공적으로 입력되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("송장번호 입력 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 송장번호 삭제
exports.deleteTrackingNumber = (req, res) => {
  try {
    const { order_detail_app_id, userId } = req.body;
    
    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    const deleteTrackingNumberQuery = `
      UPDATE member_order_detail_app SET
        courier_code = NULL
        , tracking_number = NULL
        , goodsflow_id = NULL
        , mod_dt = ?
        , mod_id = ?
      WHERE order_detail_app_id IN (?)
    `;

    db.query(
      deleteTrackingNumberQuery,
      [mod_dt, userId, order_detail_app_id],
      (err, result) => {
        if (err) {
          console.error("송장번호 삭제 오류:", err);
          return res
            .status(500)
            .json({ error: "송장번호 삭제 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "송장번호가 성공적으로 삭제되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("송장번호 삭제 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 주문상태 변경
exports.updateOrderStatus = (req, res) => {
  try {
    const { order_detail_app_id, order_status, userId, order_group } = req.body;
    
    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    // 동적 SET 절 구성: order_group 이 전달된 경우에만 포함
    const setClause = [
      "order_status = ?"
    ];
    const params = [order_status];

    if (order_group !== undefined && order_group !== null) {
      setClause.push("order_group = ?");
      params.push(order_group);
    }

    setClause.push("mod_dt = ?", "mod_id = ?");
    params.push(mod_dt, userId);

    const updateQuery = `
      UPDATE member_order_detail_app SET
        ${setClause.join("\n        , ")}
      WHERE order_detail_app_id IN (?)
    `;

    params.push(order_detail_app_id);

    db.query(
      updateQuery,
      params,
      (err, result) => {
        if (err) {
          console.error("주문상태 변경 오류:", err);
          return res
            .status(500)
            .json({ error: "주문상태 변경 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "주문상태 변경이 성공적으로 완료되었습니다.",
          success: true
        });
      }
    );
  } catch (error) {
    console.error("주문상태 변경 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 주문 그룹 변경
exports.updateOrderGroup = (req, res) => {
  try {
    const { order_detail_app_id, new_group_number, userId } = req.body;
    
    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    const updateOrderGroupQuery = `
      UPDATE member_order_detail_app SET
        order_group = ?
        , mod_dt = ?
        , mod_id = ?
      WHERE order_detail_app_id IN (?)
    `;

    db.query(
      updateOrderGroupQuery,
      [new_group_number, mod_dt, userId, order_detail_app_id],
      (err, result) => {
        if (err) {
          console.error("주문 그룹 변경 오류:", err);
          return res
            .status(500)
            .json({ error: "주문 그룹 변경 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "주문 그룹 변경이 성공적으로 완료되었습니다.",
          success: true
        });
      }
    );
  } catch (error) {
    console.error("주문 그룹 변경 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 굿스플로 송장번호 입력
exports.updateGoodsflowId = (req, res) => {
  try {
    const { order_detail_app_id, goodsflow_id, userId } = req.body;
    
    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    const updateGoodsflowIdQuery = `
      UPDATE member_order_detail_app SET
        goodsflow_id = ?
        , mod_dt = ?
        , mod_id = ?
      WHERE order_detail_app_id IN (?)
    `;

    db.query(
      updateGoodsflowIdQuery,
      [goodsflow_id, mod_dt, userId, order_detail_app_id],
      (err, result) => {
        if (err) {
          console.error("굿스플로 송장번호 입력 오류:", err);
          return res
            .status(500)
            .json({ error: "굿스플로 송장번호 입력 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "굿스플로 송장번호가 성공적으로 입력되었습니다.",
          success: true
        });
      }
    );
  } catch (error) {
    console.error("굿스플로 송장번호 입력 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 주문 수량 수정 (상세 기준으로 분할/이동)
exports.updateNewMemberOrderApp = (req, res) => {
  try {
    // 선호 파라미터: order_detail_app_id, order_quantity
    // 하위호환: order_app_id만 온 경우, 해당 주문의 대표 상세 1건을 대상으로 처리
    const { order_detail_app_id, order_app_id, order_quantity, userId } = req.body;

    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");
    const reg_dt = mod_dt;

    const targetDetailIdsPromise = () => {
      if (order_detail_app_id) {
        const ids = Array.isArray(order_detail_app_id) ? order_detail_app_id : [order_detail_app_id];
        return Promise.resolve(ids.filter((v) => v != null));
      }
      if (order_app_id) {
        return new Promise((resolve, reject) => {
          const q = `
            SELECT
              order_detail_app_id
            FROM  member_order_detail_app
            WHERE order_app_id = ?
            ORDER BY order_detail_app_id DESC
            LIMIT 1
          `;
          db.query(q, [order_app_id], (err, rows) => {
            if (err) return reject(err);
            resolve(rows && rows[0] ? [rows[0].order_detail_app_id] : []);
          });
        });
      }
      return Promise.resolve([]);
    };

    const createdDetailIds = [];
    targetDetailIdsPromise()
      .then((detailIds) => {
        const processNext = (idx) => {
          if (idx >= detailIds.length) {
            return res.status(200).json({ message: "주문 수량이 성공적으로 수정되었습니다.", createdDetailIds });
          }

          const targetDetailId = detailIds[idx];
          if (targetDetailId == null) {
            return processNext(idx + 1);
          }

          const selectQuery = `
            SELECT
              moda.order_detail_app_id
              , moda.order_app_id
              , moda.product_detail_app_id
              , moda.order_status
              , moda.courier_code AS source_courier_code
              , moda.tracking_number AS source_tracking_number
              , moda.goodsflow_id AS source_goodsflow_id
              , moda.order_quantity AS current_qty
              , moda.order_group AS original_group
              , (
                  SELECT IFNULL(MAX(moda2.order_group), 0)
                  FROM member_order_detail_app moda2
                  WHERE moda2.order_app_id = moda.order_app_id
                ) AS max_group
            FROM member_order_detail_app moda
            WHERE moda.order_detail_app_id = ?
          `;

          db.query(selectQuery, [targetDetailId], (selErr, rows) => {
            if (selErr) {
              console.error("주문 상세 정보 조회 오류:", selErr);
              return res.status(500).json({ error: "주문 상세 정보 조회 중 오류가 발생했습니다." });
            }
            if (!rows || rows.length === 0) {
              return processNext(idx + 1);
            }

            const info = rows[0];
            const currentQty = Number(info.current_qty) || 0;
            const cancelQty = Math.max(0, Math.min(Number(order_quantity) || 0, currentQty));
            const remainQty = Math.max(0, currentQty - cancelQty);

            const newGroup = (Number(info.max_group) || 0) + 1;
            const originalGroup = Number(info.original_group) || 1;

            // 1) 대상 상세를 취소 수량으로 축소하고, 신규 그룹으로 이동

            const updateDetailQuery = `
              UPDATE member_order_detail_app SET
                order_quantity = ?
                , order_group = ?
                , mod_dt = ?
                , mod_id = ?
              WHERE order_detail_app_id = ?
            `;
            db.query(
              updateDetailQuery,
              [cancelQty, newGroup, mod_dt, userId, targetDetailId],
              (updErr) => {
                if (updErr) {
                  console.error("주문 상세 수량 수정 오류:", updErr);
                  return res.status(500).json({ error: "주문 수량 수정 중 오류가 발생했습니다." });
                }

                // 2) 남은 수량이 있으면 동일 정보로 새 상세 생성 (원래 그룹으로 유지)
                if (remainQty > 0) {

                  const insertDetailQuery = `
                    INSERT INTO member_order_detail_app (
                      order_app_id
                      , product_detail_app_id
                      , order_status
                      , order_quantity
                      , order_group
                      , courier_code
                      , tracking_number
                      , goodsflow_id
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
                      , NULL
                      , NULL
                    )
                  `;
                  db.query(
                    insertDetailQuery,
                    [
                      info.order_app_id,
                      info.product_detail_app_id,
                      info.order_status || 'PAYMENT_COMPLETE',
                      remainQty,
                      originalGroup,
                      info.source_courier_code || null,
                      info.source_tracking_number || null,
                      info.source_goodsflow_id || null,
                      reg_dt,
                      userId,
                    ],
                    (insErr, insRes) => {
                      if (insErr) {
                        console.error("분할 주문 상세 생성 오류:", insErr);
                        return res.status(500).json({ error: "분할 주문 상세 생성 중 오류가 발생했습니다." });
                      }

                      // 새로 생성된 상세 주문 PK로 주소 복사 인서트 (기존 상세의 최신 주소값 사용)
                      const newDetailId = (insRes && insRes.insertId) ? insRes.insertId : null;
                      if (!newDetailId) {
                        return processNext(idx + 1);
                      }
                      try { createdDetailIds.push(newDetailId); } catch (e) {}

                      const insertAddressCopyQuery = `
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
                          , IFNULL(moad.mem_id, '')
                          , IFNULL(moad.receiver_name, '')
                          , IFNULL(moad.receiver_phone, '')
                          , IFNULL(moad.address, '')
                          , IFNULL(moad.address_detail, '')
                          , IFNULL(moad.zip_code, '')
                          , moad.enter_way
                          , moad.enter_memo
                          , moad.delivery_request
                          , 'Y'
                          , ?
                          , ?
                          , NULL
                          , NULL
                        FROM member_order_address AS moad
                        INNER JOIN member_order_detail_app moda ON moad.order_detail_app_id = moda.order_detail_app_id
                        WHERE moda.order_app_id = ?
                        ORDER BY (moad.order_detail_app_id = ?) DESC, moad.order_address_id DESC
                        LIMIT 1
                      `;

                      db.query(
                        insertAddressCopyQuery,
                        [newDetailId, reg_dt, userId, info.order_app_id, targetDetailId],
                        (addrErr, addrRes) => {
                          if (addrErr) {
                            console.error("신규 상세 주소 복사 등록 오류:", addrErr);
                            // 주소 복사 실패해도 흐름은 계속 진행
                            return processNext(idx + 1);
                          }
                          const affected = addrRes && addrRes.affectedRows ? addrRes.affectedRows : 0;
                          if (affected > 0) {
                            return processNext(idx + 1);
                          }

                          // Fallback: 동일 회원의 과거 주문 주소 중 최신 1건을 복사
                          const selectMemIdQuery = `SELECT mem_id FROM member_order_app WHERE order_app_id = ? LIMIT 1`;
                          db.query(selectMemIdQuery, [info.order_app_id], (memErr, memRows) => {
                            if (memErr) {
                              return processNext(idx + 1);
                            }
                            const memId = memRows && memRows[0] ? memRows[0].mem_id : null;
                            if (!memId) {
                              return processNext(idx + 1);
                            }

                            const insertFromMemberQuery = `
                              INSERT INTO member_order_address (
                                order_detail_app_id
                                , order_address_type
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
                                , IFNULL(moad.receiver_name, '')
                                , IFNULL(moad.receiver_phone, '')
                                , IFNULL(moad.address, '')
                                , IFNULL(moad.address_detail, '')
                                , IFNULL(moad.zip_code, '')
                                , moad.enter_way
                                , moad.enter_memo
                                , moad.delivery_request
                                , 'Y'
                                , ?
                                , ?
                                , NULL
                                , NULL
                              FROM member_order_address moad
                              INNER JOIN member_order_detail_app moda ON moad.order_detail_app_id = moda.order_detail_app_id
                              INNER JOIN member_order_app moa ON moda.order_app_id = moa.order_app_id
                              WHERE moa.mem_id = ?
                              AND moad.use_yn = 'Y'
                              ORDER BY moad.order_address_id DESC
                              LIMIT 1
                            `;

                            db.query(
                              insertFromMemberQuery,
                              [newDetailId, reg_dt, userId, memId],
                              (addr2Err, addr2Res) => {
   
                                return processNext(idx + 1);
                              }
                            );
                          });
                        }
                      );
                    }
                  );
                } else {
                  return processNext(idx + 1);
                }
              }
            );
          });
        };

        processNext(0);
      })
      .catch((err) => {
        console.error("주문 상세 대상 조회 오류:", err);
        res.status(500).json({ error: "서버 오류가 발생했습니다." });
      });
  } catch (error) {
    console.error("주문 수량 수정 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 주문 삭제  
exports.deleteMemberOrderApp = (req, res) => {
  try {
    const { order_app_id, userId } = req.body;
    
    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    const updateMemberOrderAppTrackingNumberQuery = `
      UPDATE member_order_app SET
        del_yn = 'Y'
        , mod_dt = ?
        , mod_id = ?
      WHERE order_app_id IN (?)
    `;

    db.query(
      updateMemberOrderAppTrackingNumberQuery,
      [mod_dt, userId, order_app_id],
      (err, result) => {
        if (err) {
          console.error("주문 삭제 오류:", err);
          return res
            .status(500)
            .json({ error: "주문 삭제 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "주문이 성공적으로 삭제되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("주문 삭제 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};
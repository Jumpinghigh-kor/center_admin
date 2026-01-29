const db = require("../../../db");
const dayjs = require("dayjs");

const normalizeIds = (ids) => {
  if (Array.isArray(ids)) return ids;
  if (ids == null) return [];
  return [ids];
};

// 반품/취소 승인 시 포인트/쿠폰 복구
exports.returnPointCoupon = (req, res) => {
  try {
    const { order_detail_app_id, userId } = req.body;
    const detailIds = normalizeIds(order_detail_app_id).filter((v) => v != null);
    if (detailIds.length === 0) {
      return res.status(400).json({ error: "order_detail_app_id is required" });
    }

    const selectDetailQuery = `
      SELECT
        moda.order_detail_app_id
        , moa.order_app_id
        , moa.account_app_id
        , IFNULL(SUM(CASE
            WHEN mpa.point_status = 'POINT_MINUS' AND mpa.del_yn = 'N' THEN mpa.point_amount
            ELSE 0
          END), 0) AS used_point
        , MAX(CASE
            WHEN mpa.point_status = 'POINT_ADD'
              AND mpa.del_yn = 'N'
              AND mpa.point_memo = '반품승인 포인트 복구'
            THEN 1
            ELSE 0
          END) AS has_refund_point
      FROM        member_order_detail_app moda
      INNER JOIN  member_order_app moa ON moa.order_app_id = moda.order_app_id
      LEFT JOIN   member_point_app mpa ON mpa.order_detail_app_id = moda.order_detail_app_id
      WHERE       moda.order_detail_app_id IN (?)
      GROUP BY    moda.order_detail_app_id, moa.order_app_id, moa.account_app_id
    `;

    db.query(selectDetailQuery, [detailIds], (selErr, rows) => {
      if (selErr) {
        console.error("포인트/쿠폰 복구 대상 조회 오류:", selErr);
        return res.status(500).json({ error: "복구 대상 조회 중 오류가 발생했습니다." });
      }

      const orderAppIds = new Set();
      const now = dayjs();
      const reg_dt = now.format("YYYYMMDDHHmmss");

      const insertPointQuery = `
        INSERT INTO member_point_app (
          account_app_id
          , order_detail_app_id
          , point_type
          , point_status
          , point_amount
          , point_memo
          , del_yn
          , reg_dt
          , reg_id
          , mod_dt
          , mod_id
        ) VALUES (
          ?
          , ?
          , ?
          , 'POINT_ADD'
          , ?
          , ?
          , 'N'
          , ?
          , ?
          , NULL
          , NULL
        )
      `;

      const pointTasks = (rows || []).map((row) => {
        const orderDetailAppId = row && row.order_detail_app_id;
        const accountAppId = row && row.account_app_id;
        const orderAppId = row && row.order_app_id;
        if (orderAppId != null) orderAppIds.add(orderAppId);

        const usedPoint = Number(row?.used_point || 0);
        if (!orderDetailAppId || accountAppId == null || usedPoint <= 0) return Promise.resolve();
        if (row?.has_refund_point) return Promise.resolve();

        return new Promise((resolve, reject) => {
          db.query(
            insertPointQuery,
            [
              accountAppId,
              orderDetailAppId,
              "POINT_ADMIN_ADD",
              usedPoint,
              "반품승인 포인트 복구",
              reg_dt,
              userId || null,
            ],
            (insErr) => {
              if (insErr) return reject(insErr);
              return resolve();
            }
          );
        });
      });

      Promise.all(pointTasks)
        .then(() => {
          const orderIds = Array.from(orderAppIds);
          if (orderIds.length === 0) {
            return res.status(200).json({ message: "복구 완료" });
          }

          const selectCouponQuery = `
            SELECT
              member_coupon_app_id
              , coupon_app_id
              , order_app_id
              , account_app_id
              , use_yn
              , use_dt
              , reg_dt
              , reg_id
              , mod_dt
              , mod_id
            FROM member_coupon_app
            WHERE order_app_id IN (?)
            AND use_yn = 'Y'
          `;

          db.query(selectCouponQuery, [orderIds], (selCouponErr, couponRows) => {
            if (selCouponErr) {
              console.error("쿠폰 조회 오류:", selCouponErr);
              return res.status(500).json({ error: "쿠폰 조회 중 오류가 발생했습니다." });
            }

            if (!couponRows || couponRows.length === 0) {
              return res.status(200).json({ message: "복구 완료" });
            }

            const updateCouponQuery = `
              UPDATE member_coupon_app SET
                order_app_id = NULL
                , use_yn = 'N'
                , mod_dt = ?
                , mod_id = ?
              WHERE member_coupon_app_id IN (?)
            `;
            const couponIds = couponRows.map((row) => row.member_coupon_app_id).filter((v) => v != null);
            if (couponIds.length === 0) {
              return res.status(200).json({ message: "복구 완료" });
            }

            db.query(updateCouponQuery, [reg_dt, userId || null, couponIds], (updErr) => {
              if (updErr) {
                console.error("쿠폰 복구 오류:", updErr);
                return res.status(500).json({ error: "쿠폰 복구 중 오류가 발생했습니다." });
              }
              return res.status(200).json({ message: "복구 완료" });
            });
          });
        })
        .catch((insErr) => {
          console.error("포인트 복구 오류:", insErr);
          return res.status(500).json({ error: "포인트 복구 중 오류가 발생했습니다." });
        });
    });
  } catch (error) {
    console.error("포인트/쿠폰 복구 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 회원 취소/반품/교환 접수
exports.insertMemberReturnApp = (req, res) => {
  try {
    const { order_detail_app_id, order_address_id, userId, return_reason_type, reason, quantity, account_app_id } = req.body;

    // 현재 날짜 형식화
    const now = dayjs();
    const reg_dt = now.format("YYYYMMDDHHmmss");

    // member_return_app 테이블에 반품 정보 등록
    const memberReturnAppInsertQuery = `
      INSERT INTO member_return_app (
        order_detail_app_id
        , order_address_id
        , account_app_id
        , return_applicator
        , return_reason_type
        , reason
        , customer_tracking_number
        , company_tracking_number
        , customer_courier_code
        , company_courier_code
        , quantity
        , approval_yn
        , cancel_yn
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
      memberReturnAppInsertQuery,
      [
        order_detail_app_id,
        order_address_id,
        account_app_id,
        'ADMIN',
        return_reason_type,
        reason,
        null,
        null,
        'CJ',
        null,
        quantity,
        null,
        'N',
        'N',
        reg_dt,
        account_app_id,
        null,
        null,
      ],
      (err, result) => {
        if (err) {
          console.error("반품 정보 등록 오류:", err);
          return res
            .status(500)
            .json({ error: "반품 정보 등록 중 오류가 발생했습니다." });
        }
        res.status(201).json({
          memberReturnAppId: result.insertId,
        });
      }
    );
  } catch (error) {
    console.error("반품 정보 등록 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 반품/교환/취소 정보 수정
exports.updateMemberReturnApp = (req, res) => {
  try {
    const { order_detail_app_id, userId, return_reason_type, reason, quantity, order_address_id, approval_yn, cancel_yn } = req.body;

    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    const setClause = [
      "return_reason_type = ?",
      "reason = ?",
      "quantity = ?",
    ];
    const params = [return_reason_type, reason, quantity];

    if (order_address_id !== undefined && order_address_id !== null) {
      setClause.unshift("order_address_id = ?");
      params.unshift(order_address_id);
    }

    setClause.push("approval_yn = ?", "cancel_yn = ?", "mod_dt = ?", "mod_id = ?");
    const _approvalYn = (approval_yn !== undefined && approval_yn !== null) ? approval_yn : null;
    const _cancelYn   = (cancel_yn !== undefined && cancel_yn !== null) ? cancel_yn : 'N';
    params.push(_approvalYn, _cancelYn, mod_dt, userId);
    params.push(order_detail_app_id);

    const updateMemberReturnAppQuery = `
      UPDATE member_return_app SET
        ${setClause.join("\n        , ")}
      WHERE order_detail_app_id IN (?)
    `;

    db.query(
      updateMemberReturnAppQuery,
      params,
      (err, result) => {
        if (err) {
          console.error("반품/교환/취소 정보 수정 오류:", err);
          return res
            .status(500)
            .json({ error: "반품/교환/취소 정보 수정 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "반품/교환/취소 정보 수정이 성공적으로 완료되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("반품/교환/취소 정보 수정 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 반품/교환/취소 승인 취소
exports.updateMemberReturnAppApproval = (req, res) => {
  try {
    const { order_detail_app_id, approval_yn, cancel_yn, userId } = req.body;

    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    const updateMemberReturnAppApprovalQuery = `
      UPDATE member_return_app SET
        approval_yn = ?
        , cancel_yn = ?
        , mod_dt = ?
        , mod_id = ?
      WHERE order_detail_app_id IN (?)
    `;

    db.query(
      updateMemberReturnAppApprovalQuery,
      [approval_yn, cancel_yn, mod_dt, userId, order_detail_app_id],
      (err, result) => {
        if (err) {
          console.error("반품/교환/취소 승인 취소 오류:", err);
          return res
            .status(500)
            .json({ error: "반품/교환/취소 승인 취소 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "반품/교환/취소 승인 취소가 성공적으로 완료되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("반품/교환/취소 승인 취소 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 굿스플로 반품 아이디 입력
exports.updateReturnGoodsflowId = (req, res) => {
  try {
    const { order_detail_app_id, return_goodsflow_id, userId } = req.body;
    
    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    const updateReturnGoodsflowIdQuery = `
      UPDATE member_return_app SET
        return_goodsflow_id = ?
        , mod_dt = ?
        , mod_id = ?
      WHERE order_detail_app_id IN (?)
    `;

    db.query(
      updateReturnGoodsflowIdQuery,
      [return_goodsflow_id, mod_dt, userId, order_detail_app_id],
      (err, result) => {
        if (err) {
          console.error("굿스플로 반품 아이디 입력 오류:", err);
          return res
            .status(500)
            .json({ error: "굿스플로 반품 아이디 입력 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "굿스플로 반품 아이디가 성공적으로 입력되었습니다.",
          success: true
        });
      }
    );
  } catch (error) {
    console.error("굿스플로 반품 아이디 입력 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 구매자 송장 번호 입력
exports.updateReturnCustomerTrackingNumber = (req, res) => {
  try {
    const { order_detail_app_id, customer_tracking_number, userId, transporter } = req.body;
   
    let courierCode = '';
    if (transporter == 'KOREX') {
      courierCode = 'CJ';
    } else {
      courierCode = String(transporter || '').toUpperCase();
    }

    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    const updateReturnCustomerInfoQuery = `
      UPDATE member_return_app SET
        customer_tracking_number = ?
        , return_goodsflow_id = NULL
        , customer_courier_code = ?
        , mod_dt = ?
        , mod_id = ?
      WHERE order_detail_app_id IN (?)
    `;

    db.query(
      updateReturnCustomerInfoQuery,
      [customer_tracking_number, courierCode, mod_dt, userId, order_detail_app_id],
      (err, result) => {
        if (err) {
          console.error("구매자 송장 정보 입력 오류:", err);
          return res
            .status(500)
            .json({ error: "구매자 송장 정보 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "구매자 송장 정보가 성공적으로 입력되었습니다.",
          success: true
        });
      }
    );
  } catch (error) {
    console.error("구매자 송장 정보 입력 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 교환 회사 송장 번호 입력
exports.updateExchangeCompanyTrackingInfo = (req, res) => {
  try {
    const { order_detail_app_id, company_tracking_number, company_courier_code, userId } = req.body;
    
    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    const updateExchangeCompanyTrackingInfoQuery = `
      UPDATE member_return_app SET
        company_tracking_number = ?
        , company_courier_code = ?
        , mod_dt = ?
        , mod_id = ?
      WHERE order_detail_app_id IN (?)
    `;

    db.query(
      updateExchangeCompanyTrackingInfoQuery,
      [company_tracking_number, company_courier_code, mod_dt, userId, order_detail_app_id],
      (err, result) => {
        if (err) {
          console.error("교환 회사 송장 정보 입력 오류:", err);
          return res
            .status(500)
            .json({ error: "교환 회사 송장 정보 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "교환 회사 송장 정보가 성공적으로 입력되었습니다.",
          success: true
        });
      }
    );
  } catch (error) {
    console.error("교환 회사 송장 정보 입력 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 반품/교환/취소 삭제
exports.deleteMemberReturnApp = (req, res) => {
  try {
    const { order_detail_app_id, userId } = req.body;

    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    const updateMemberReturnAppApprovalQuery = `
      UPDATE member_return_app SET
        del_yn = 'Y'
        , mod_dt = ?
        , mod_id = ?
      WHERE order_detail_app_id IN (?)
    `;

    db.query(
      updateMemberReturnAppApprovalQuery,
      [mod_dt, userId, order_detail_app_id],
      (err, result) => {
        if (err) {
          console.error("반품/교환/취소 삭제 오류:", err);
          return res
            .status(500)
            .json({ error: "반품/교환/취소 삭제 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "반품/교환/취소 삭제가 성공적으로 완료되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("반품/교환/취소 삭제 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};
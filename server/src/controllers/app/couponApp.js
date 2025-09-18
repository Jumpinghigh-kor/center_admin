const db = require("../../../db");
const dayjs = require("dayjs");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");

// 쿠폰 목록 조회
exports.selectCouponAppList = (req, res) => {
  const { brand_name, product_name, min_discount_amount, max_discount_amount, discount_type, min_order_amount, max_order_amount, start_dt, end_dt } = req.body;

  let addCondition = '';
  let params = [];
  
  const formatDate = (date) => {
    return date.replace(/-/g, '');
  }

  if(brand_name) {
    addCondition += ` AND pa.brand_name LIKE CONCAT('%', ?, '%')`;
    params.push(brand_name);
  }

  if(product_name) {
    addCondition += ` AND pa.title LIKE CONCAT('%', ?, '%')`;
    params.push(product_name);
  }
  
  // 할인 금액/단위는 항상 함께 온다고 가정하고 하나의 블록으로 처리
  if (min_discount_amount || max_discount_amount || discount_type) {
    if (discount_type) {
      addCondition += ` AND ca.discount_type = ?`;
      params.push(discount_type);
    }

    if (min_discount_amount && max_discount_amount) {
      addCondition += ` AND ca.discount_amount BETWEEN ? AND ?`;
      params.push(min_discount_amount, max_discount_amount);
    } else if (min_discount_amount) {
      addCondition += ` AND ca.discount_amount >= ?`;
      params.push(min_discount_amount);
    } else if (max_discount_amount) {
      addCondition += ` AND ca.discount_amount <= ?`;
      params.push(max_discount_amount);
    }
  }
  

  if(min_order_amount && max_order_amount) {
    addCondition += ` AND ca.min_order_amount BETWEEN ? AND ?`;
    params.push(min_order_amount, max_order_amount);
  } else if(min_order_amount) {
    addCondition += ` AND ca.min_order_amount >= ?`;
    params.push(min_order_amount);
  } else if(max_order_amount) {
    addCondition += ` AND ca.min_order_amount <= ?`;
    params.push(max_order_amount);
  }

  if(start_dt && end_dt) {
    addCondition += ` AND DATE_FORMAT(ca.start_dt, '%Y%m%d') <= ? AND DATE_FORMAT(ca.end_dt, '%Y%m%d') >= ?`;
    params.push(formatDate(start_dt), formatDate(end_dt));
  } else if(start_dt) {
    addCondition += ` AND DATE_FORMAT(ca.start_dt, '%Y%m%d') >= ?`;
    params.push(formatDate(start_dt));
  } else if(end_dt) {
    addCondition += ` AND DATE_FORMAT(ca.end_dt, '%Y%m%d') <= ?`;
    params.push(formatDate(end_dt));
  }

  const query = `
    SELECT
      ca.coupon_app_id
      , ca.product_app_id
      , ca.discount_type
      , ca.discount_amount
      , ca.min_order_amount
      , ca.description
      , ca.badge_text
      , DATE_FORMAT(ca.start_dt, '%Y-%m-%d %H:%i') AS start_dt
      , DATE_FORMAT(ca.end_dt, '%Y-%m-%d %H:%i') AS end_dt
      , ca.coupon_notice
      , ca.del_yn
      , DATE_FORMAT(ca.reg_dt, '%Y-%m-%d') AS reg_date
      , DATE_FORMAT(ca.reg_dt, '%H:%i:%s') AS reg_time
      , ca.reg_id
      , pa.title
      , pa.brand_name
      , pa.del_yn AS product_del_yn
      , (
          SELECT
            COUNT(*) AS have_cnt
          FROM  member_coupon_app mca
          WHERE mca.coupon_app_id = ca.coupon_app_id
          AND   mca.use_yn = 'N'
          AND   (ca.start_dt <= DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')
                AND DATE_FORMAT(NOW(), '%Y%m%d%H%i%s') <= ca.end_dt)
        ) AS have_cnt
    FROM		  coupon_app ca
    LEFT JOIN	product_app pa ON ca.product_app_id = pa.product_app_id
    WHERE		  ca.del_yn = 'N'
    ${addCondition}
    ORDER BY  ca.coupon_app_id DESC
  `;

  db.query(query, params, (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 쿠폰 상세 조회
exports.selectCouponAppDetail = (req, res) => {
  const { coupon_app_id} = req.body;

  const query = `
    SELECT
      ca.coupon_app_id
      , ca.product_app_id
      , ca.discount_type
      , ca.discount_amount
      , ca.min_order_amount
      , ca.description
      , ca.badge_text
      , DATE_FORMAT(ca.start_dt, '%Y-%m-%d %H:%i') AS start_dt
      , DATE_FORMAT(ca.end_dt, '%Y-%m-%d %H:%i') AS end_dt
      , ca.coupon_notice
      , ca.del_yn
      , DATE_FORMAT(ca.reg_dt, '%Y-%m-%d') AS reg_date
      , DATE_FORMAT(ca.reg_dt, '%H:%i:%s') AS reg_time
      , ca.reg_id
      , pa.title
      , pa.brand_name
      , pa.del_yn AS product_del_yn
      , (
          SELECT
            COUNT(*) AS have_cnt
          FROM  member_coupon_app mca
          WHERE mca.coupon_app_id = ca.coupon_app_id
          AND   mca.use_yn = 'N'
          AND   (ca.start_dt <= DATE_FORMAT(NOW(), '%Y%m%d%H%i%s')
                AND DATE_FORMAT(NOW(), '%Y%m%d%H%i%s') <= ca.end_dt)
        ) AS have_cnt
    FROM		  coupon_app ca
    LEFT JOIN	product_app pa ON ca.product_app_id = pa.product_app_id
    WHERE		  ca.coupon_app_id = ?
  `;

  db.query(query, [coupon_app_id], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 쿠폰 이미지 목록 조회
exports.selectMemberCouponAppList = (req, res) => {
  const { coupon_app_id } = req.body;

  const query = `
    SELECt
      m.mem_id
      , m.mem_name
      , mca.member_coupon_app_id
      , mca.coupon_app_id
      , mca.use_yn
      , mca.use_dt
      , DATE_FORMAT(mca.reg_dt, '%Y-%m-%d %H:%i:%s') AS reg_dt
    FROM		    members m
    INNER JOIN	member_coupon_app mca 	ON m.mem_id = mca.mem_id
    INNER JOIN	coupon_app ca 			ON mca.coupon_app_id = ca.coupon_app_id
    WHERE		    ca.coupon_app_id = ?
    ORDER BY	  ca.coupon_app_id, m.mem_id DESC
  `;

  db.query(query, [coupon_app_id], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 쿠폰 등록
exports.insertCouponApp = (req, res) => {
  const { product_app_id, discount_type, discount_amount, min_order_amount, description, badge_text, start_dt, end_dt, coupon_notice, user_id } = req.body;

  const now = dayjs();
  const reg_dt = now.format("YYYYMMDDHHmmss");

  const insertCouponQuery = `
    INSERT INTO coupon_app (
      product_app_id
      , discount_type
      , discount_amount
      , min_order_amount
      , description
      , badge_text
      , start_dt
      , end_dt
      , coupon_notice
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
    )
  `;

  db.query(insertCouponQuery, [
    product_app_id
    , discount_type
    , discount_amount
    , min_order_amount
    , description
    , badge_text
    , start_dt
    , end_dt
    , coupon_notice
    , 'N'
    , reg_dt
    , user_id
    , null
    , null
  ], (err, result) => {
    if (err) {
      console.log(err.sqlMessage);
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 쿠폰 수정
exports.updateCouponApp = (req, res) => {
  try {
    const { coupon_app_id, user_id, product_app_id, discount_type, discount_amount, min_order_amount, description, badge_text, start_dt, end_dt, coupon_notice } = req.body;

    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    const updateCouponQuery = `
      UPDATE coupon_app  SET
        product_app_id = ?
        , discount_type = ?
        , discount_amount = ?
        , min_order_amount = ?
        , description = ?
        , badge_text = ?
        , start_dt = ?
        , end_dt = ?
        , coupon_notice = ?
        , mod_dt = ?
        , mod_id = ?
      WHERE coupon_app_id = ?
    `;

    db.query(updateCouponQuery, [product_app_id, discount_type, discount_amount, min_order_amount, description, badge_text, start_dt, end_dt, coupon_notice, mod_dt, user_id || null, coupon_app_id], (err, result) => {
        if (err) {
          console.error("쿠폰 수정 오류:", err.sqlMessage);
          return res
            .status(500)
            .json({ error: "쿠폰 수정 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "쿠폰가 성공적으로 수정되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("쿠폰 수정 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 쿠폰 삭제
exports.deleteCouponApp = (req, res) => {
  try {
    const { coupon_app_id, user_id } = req.body;

    if (
      !coupon_app_id ||
      !Array.isArray(coupon_app_id) ||
      coupon_app_id.length === 0
    ) {
      return res.status(400).json({ error: "삭제할 쿠폰 ID가 필요합니다." });
    }

    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    const deleteCouponQuery = `
      UPDATE coupon_app  SET
        del_yn = 'Y'
        , mod_dt = ?
        , mod_id = ?
      WHERE coupon_app_id IN (?)
    `;

    db.query(deleteCouponQuery, [mod_dt, user_id || null, coupon_app_id], (err, result) => {
        if (err) {
          console.error("쿠폰 삭제 오류:", err);
          return res
            .status(500)
            .json({ error: "쿠폰 삭제 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "쿠폰가 성공적으로 삭제되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("쿠폰 일괄 삭제 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

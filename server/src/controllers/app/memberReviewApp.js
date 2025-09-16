const db = require("../../../db");
const dayjs = require("dayjs");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");

// Supabase 설정
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Supabase 클라이언트 생성
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 리뷰 목록 조회
exports.selectMemberReviewAppList = (req, res) => {
  const { mem_name, brand_name, product_title, title, content, min_star_point, max_star_point } = req.body;

  let addCondition = '';
  let params = [];

  if(mem_name) {
    addCondition += ` AND m.mem_name LIKE CONCAT('%', ?, '%')`;
    params.push(mem_name);
  }

  if(brand_name) {
    addCondition += ` AND pa.brand_name LIKE CONCAT('%', ?, '%')`;
    params.push(brand_name);
  }

  if(product_title) {
    addCondition += ` AND pa.title LIKE CONCAT('%', ?, '%')`;
    params.push(product_title);
  }

  if(title) {
    addCondition += ` AND mra.title LIKE CONCAT('%', ?, '%')`;
    params.push(title);
  }

  if(min_star_point && max_star_point) {
    addCondition += ` AND mra.star_point BETWEEN ? AND ?`;
    params.push(min_star_point, max_star_point);
  } else if(min_star_point) {
    addCondition += ` AND mra.star_point >= ?`;
    params.push(min_star_point);
  } else if(max_star_point) {
    addCondition += ` AND mra.star_point <= ?`;
    params.push(max_star_point);
  }

  if(content) {
    addCondition += ` AND mra.content LIKE CONCAT('%', ?, '%')`;
    params.push(content);
  }

  const query = `
    SELECT
      m.mem_id
      , m.mem_name
      , mra.review_app_id
      , mra.title
      , mra.content
      , mra.star_point
      , mra.del_yn
      , mra.admin_del_yn
      , DATE_FORMAT(mra.reg_dt, '%Y-%m-%d %H:%i:%s') AS reg_dt
      , pa.title AS product_title
      , pa.brand_name
    FROM		    members m
    INNER JOIN	member_review_app mra ON m.mem_id = mra.mem_id
    LEFT JOIN	  product_app pa	ON mra.product_app_id = pa.product_app_id
    WHERE		    mra.del_yn = 'N'
    AND			    mra.admin_del_yn = 'N'
    ${addCondition}
    ORDER BY    mra.review_app_id DESC
  `;

  db.query(query, params, (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 리뷰 이미지 목록 조회
exports.selectMemberReviewAppImgList = (req, res) => {
  const { review_app_id } = req.body;

  const query = `
    SELECT
      cf.file_id
      , cf.file_name
      , cf.file_path
      , cf.file_division
    FROM		  member_review_app_img mrai
    LEFT JOIN	common_file cf	ON mrai.file_id = cf.file_id
    WHERE		  mrai.del_yn = 'N'
    AND			  mrai.review_app_id = ?
    ORDER BY  mrai.order_seq ASC
  `;

  db.query(query, [review_app_id], (err, results) => {
    if (err) {
      console.error("리뷰 목록 조회 오류:", err);
      return res
        .status(500)
        .json({ error: "리뷰 목록을 조회하는 도중 오류가 발생했습니다." });
    }

    // 결과 포맷팅
    const review = results.map((review) => {
      // Supabase URL 구성
      let imageUrl = null;
      if (review.file_name) {
        imageUrl = supabase.storage
          .from("review")
          .getPublicUrl(`review/${review.file_name}`).data.publicUrl;
      }

      return {
        fileId: review.file_id,
        fileName: review.file_name,
        filePath: review.file_path,
        fileDivision: review.file_division,
        imageUrl: imageUrl,
      };
    });

    res.status(200).json(review);
  });
};

// 리뷰 삭제
exports.deleteMemberReviewApp = (req, res) => {
  try {
    const { review_app_id, user_id } = req.body;

    if (
      !review_app_id ||
      !Array.isArray(review_app_id) ||
      review_app_id.length === 0
    ) {
      return res.status(400).json({ error: "삭제할 리뷰 ID가 필요합니다." });
    }

    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    const deleteReviewQuery = `
      UPDATE member_review_app  SET
        admin_del_yn = 'Y'
        , mod_dt = ?
        , mod_id = ?
      WHERE review_app_id IN (?)
    `;

    db.query(deleteReviewQuery, [mod_dt, user_id || null, review_app_id], (err, result) => {
        if (err) {
          console.error("리뷰 삭제 오류:", err);
          return res
            .status(500)
            .json({ error: "리뷰 삭제 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "리뷰가 성공적으로 삭제되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("리뷰 일괄 삭제 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

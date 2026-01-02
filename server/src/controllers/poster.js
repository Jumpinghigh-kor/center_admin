const db = require("../../db");
const dayjs = require("dayjs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

//포스터 기본 목록 조회
exports.getPosterBaseList = (req, res) => {
  const query =`
    SELECT
      pb.poster_id
      , pb.title
      , DATE_FORMAT(pb.start_dt, '%Y-%m-%d %H:%i') AS start_dt
      , DATE_FORMAT(pb.end_dt, '%Y-%m-%d %H:%i') AS end_dt
      , DATE_FORMAT(pb.reg_dt, '%Y-%m-%d %H:%i') AS reg_dt
      , pb.reg_id
      , (
          SELECT
            GROUP_CONCAT(spd.poster_type) AS poster_type
          FROM  poster_detail spd
          WHERE spd.poster_id = pb.poster_id
          AND   spd.use_yn = 'Y'
        ) AS poster_type
    FROM  poster_base pb
    WHERE pb.del_yn = 'N'
    AND   (pb.start_dt <= DATE_FORMAT(NOW(), '%Y%m%d%H%i%s') AND DATE_FORMAT(NOW(), '%Y%m%d%H%i%s') <= pb.end_dt)
    ORDER BY  pb.poster_id DESC

  `
  db.query(query, (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

//포스터 기본 목록 조회
exports.getPosterDetail = (req, res) => {
  const { poster_id } = req.query;
  const query =`
    SELECT
      pb.poster_id
      , pb.title
      , DATE_FORMAT(pb.start_dt, '%Y-%m-%d %H:%i') AS start_dt
      , DATE_FORMAT(pb.end_dt, '%Y-%m-%d %H:%i') AS end_dt
      , cf.file_id
      , cf.file_name
      , cf.file_path
      , cf.file_division
      , pd.poster_detail_id
      , pd.poster_type
      , pd.font_family
      , pd.font_size
      , pd.font_weight
      , pd.color
      , pd.x_px
      , pd.y_px
    FROM      poster_base pb
    LEFT JOIN poster_detail pd  ON pb.poster_id = pd.poster_id
    LEFT JOIN common_file cf    ON pd.file_id = cf.file_id
    WHERE     pb.poster_id = ?
    AND       pd.use_yn = 'Y'
    ORDER BY  pd.poster_type ASC, pd.poster_detail_id ASC
  `
  db.query(query, [poster_id], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

//포스터 기본 등록
exports.createPosterBase = (req, res) => {
  const { title, start_dt, end_dt, userId } = req.body;
  const time = dayjs().format("YYYYMMDDHHmmss");
  const query = `
    INSERT INTO poster_base (
      title
      , start_dt
      , end_dt
      , del_yn
      , reg_dt
      , reg_id
      , mod_dt
      , mod_id
    ) VALUES (
      ?
      ,?
      ,?
      ,?
      ,?
      ,?
      ,?
      ,?
    )
  `;
  db.query(query, [title, start_dt, end_dt, 'N', time, userId, null, null], (err, result) => {
    if (err) {
      console.log("err", err);
    }
    res.status(201).json({ result: result });
  });
};

//포스터 상세 등록
exports.createPosterDetail = (req, res) => {
  const {
    poster_id,
    file_id,
    poster_type,
    font_family,
    font_size,
    font_weight,
    color,
    x_px,
    y_px,
    userId,
  } = req.body;
  const time = dayjs().format("YYYYMMDDHHmmss");
  const query = `
    INSERT INTO poster_detail (
      poster_id
      , file_id
      , poster_type
      , font_family
      , font_size
      , font_weight
      , color
      , x_px
      , y_px
      , use_yn
      , reg_dt
      , reg_id
      , mod_dt
      , mod_id
    ) VALUES (
      ?
      ,?
      ,?
      ,?
      ,?
      ,?
      ,?
      ,?
      ,?
      ,?
      ,?
      ,?
      ,?
      ,?
    )
  `;
  db.query(
    query,
    [
      poster_id,
      file_id,
      poster_type,
      font_family,
      font_size,
      font_weight || 400,
      color,
      x_px,
      y_px,
      "Y",
      time,
      userId,
      null,
      null,
    ],
    (err, result) => {
    if (err) {
      console.log("err", err);
    }
    res.status(201).json({ result: result });
    }
  );
};

//포스터 기본 수정
exports.updatePosterBase = (req, res) => {
  const time = dayjs().format("YYYYMMDDHHmmss");
  const { poster_id, title, start_dt, end_dt, userId} = req.body;
  
  const query = `
    UPDATE poster_base SET
      title = ?
      , start_dt = ?
      , end_dt = ?
      , mod_dt = ?
      , mod_id = ?
    WHERE poster_id = ?
  `;
  db.query(
    query,
    [
      title,
      start_dt,
      end_dt,
      time,
      userId,
      poster_id,
    ],
    (err, result) => {
    if (err) {
      console.log("err", err);
    }
    res.status(201).json({ result: result });
    }
  );
};

//포스터 상세 수정
exports.updatePosterDetail = (req, res) => {
  const time = dayjs().format("YYYYMMDDHHmmss");
  const { poster_detail_id, poster_type, file_id, font_family, font_size, font_weight, color, x_px, y_px, userId} = req.body;

  const query = `
    UPDATE poster_detail SET
      poster_type = ?
      , file_id = ?
      , font_family = ?
      , font_size = ?
      , font_weight = ?
      , color = ?
      , x_px = ?
      , y_px = ?
      , mod_dt = ?
      , mod_id = ?
    WHERE poster_detail_id = ?
  `;
  db.query(
    query,
    [
      poster_type,
      file_id,
      font_family,
      font_size,
      font_weight || 400,
      color,
      x_px,
      y_px,
      time,
      userId,
      poster_detail_id,
    ],
    (err, result) => {
    if (err) {
      console.log("err", err);
    }
    res.status(201).json({ result: result });
    }
  );
};

//포스터 기본 삭제
exports.updatePosterDetailUseYn = (req, res) => {
  const time = dayjs().format("YYYYMMDDHHmmss");
  const { poster_detail_id, use_yn, userId} = req.body;
  const query = `
    UPDATE poster_detail SET
      use_yn = ?
      , mod_dt = ?
      , mod_id = ?
    WHERE poster_detail_id = ?
  `;
  db.query(query, [use_yn, time, userId, poster_detail_id], (err, result) => {
    if (err) {
      console.log("err", err);
    }
    res.status(201).json({ result: result });
    }
  );
};

// 포스터 이미지 업로드 (Supabase Storage) + common_file 등록
exports.uploadPosterImage = async (req, res) => {
  try {
    const userId = req.body.userId || req.body.user_id || null;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "포스터 이미지가 필요합니다." });
    }

    const imageFile = req.files.find((file) => file.fieldname === "image");
    if (!imageFile) {
      return res.status(400).json({ error: "포스터 이미지가 필요합니다." });
    }

    const now = dayjs();
    const reg_dt = now.format("YYYYMMDDHHmmss");
    const timestamp = Date.now() % 1000;
    const rand = Math.random().toString(36).slice(2, 8);

    const originalFilename = path.parse(imageFile.originalname);
    const fileExtension = originalFilename.ext;
    const newFilename = `poster_${originalFilename.name}_${reg_dt}${timestamp}_${rand}${fileExtension}`;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return res.status(500).json({ error: "Supabase 설정이 없습니다." });
    }

    const { error: uploadError } = await supabase.storage
      .from("poster")
      .upload(`poster/${newFilename}`, imageFile.buffer, {
        contentType: imageFile.mimetype,
      });

    if (uploadError) {
      console.error("포스터 이미지 업로드 오류:", uploadError);
      return res
        .status(500)
        .json({ error: "이미지 업로드 중 오류가 발생했습니다." });
    }

    const { data: publicURL } = supabase.storage
      .from("poster")
      .getPublicUrl(`poster/${newFilename}`);

    const fileInsertQuery = `
      INSERT INTO common_file (
        file_name
        , file_path
        , file_division
        , del_yn
        , reg_dt
        , reg_id
        , mod_dt
        , mod_id
      ) VALUES (
        ?
        , ?
        , ?
        , 'N'
        , ?
        , ?
        , ?
        , ?
      )
    `;

    db.query(
      fileInsertQuery,
      [newFilename, (publicURL && publicURL.publicUrl) || "", "POSTER", reg_dt, userId, null, null],
      (err, result) => {
        if (err) {
          console.error("파일 정보 등록 오류:", err);
          return res
            .status(500)
            .json({ error: "파일 정보 등록 중 오류가 발생했습니다." });
        }

        return res.status(201).json({
          file_id: result.insertId,
          file_name: newFilename,
          file_path: (publicURL && publicURL.publicUrl) || "",
        });
      }
    );
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};


//포스터 기본 삭제
exports.deletePosterBase = (req, res) => {
  const time = dayjs().format("YYYYMMDDHHmmss");
  const { poster_id, userId} = req.body;
  const query = `
    UPDATE poster_base SET
      del_yn = 'Y'
      , mod_dt = ?
      , mod_id = ?
    WHERE poster_id IN (?)
  `;
  db.query(query, [time, userId, poster_id], (err, result) => {
    if (err) {
      console.log("err", err);
    }
    res.status(201).json({ result: result });
    }
  );
};
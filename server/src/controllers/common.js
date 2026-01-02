const db = require("../../../db");
const dayjs = require("dayjs");

// 파일 정보 등록
exports.insertCommonFile = (req, res) => {
  const { file_name, file_path, file_division, reg_id, mod_dt, mod_id } =
    req.body;

  const reg_dt = dayjs().format("YYYYMMDDHHmmss");

  const query = `
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
    query,
    [file_name, file_path, file_division, reg_dt, reg_id, mod_dt, mod_id],
    (err, result) => {
      if (err) {
        console.error("파일 정보 등록 오류:", err);
        return res
          .status(500)
          .json({ error: "파일 정보를 등록하는 도중 오류가 발생했습니다." });
      }

      res.status(201).json({
        id: result.insertId,
        message: "파일 정보가 성공적으로 등록되었습니다.",
      });
    }
  );
};
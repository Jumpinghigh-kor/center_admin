const db = require("../../../db");
const dayjs = require("dayjs");

// 파일 정보 등록
exports.insertCommonFile = (req, res) => {
  const { file_name, file_path, file_division, reg_id, mod_dt, mod_id } = req.body;

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

// 공통 코드 조회
exports.selectCommonCodeList = (req, res) => {
  const { group_code, common_code_memo, screen } = req.body;

  let addCondition = "";

  if (common_code_memo) {
    addCondition = `
      AND cc.common_code_memo = ?
      `;
  }

  if(screen === 'commonCodeList') {
    addCondition = `
      AND cc.use_yn IS NOT NULL
      `;
  } else {
    addCondition = `
      AND cc.use_yn = 'Y'
      `;
  }

  const query = `
    SELECT
      cc.common_code
      , cc.group_code
      , cc.common_code_name
      , cc.common_code_memo
      , cc.order_seq
      , cc.use_yn
      , gc.group_code_name
    FROM      common_code cc
    LEFT JOIN group_code gc ON cc.group_code = gc.group_code
    WHERE     cc.group_code = ?
    ${addCondition}
    ORDER BY cc.order_seq ASC
  `;

  db.query(query, [group_code, common_code_memo], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 공통 코드 멀티 그룹 조회
exports.selectCommonCodeMulti = (req, res) => {
  const { group_codes = [], common_code_memo } = req.body || {};
  if (!Array.isArray(group_codes) || group_codes.length === 0) {
    return res.status(400).json({ error: 'group_codes must be a non-empty array' });
  }

  const placeholders = group_codes.map(() => '?').join(',');

  let addCondition = '';
  const params = [...group_codes];
  if (common_code_memo) {
    addCondition = ` AND cc.common_code_memo = ?`;
    params.push(common_code_memo);
  }

  const query = `
    SELECT
      cc.common_code
      , cc.group_code
      , cc.common_code_name
      , cc.common_code_memo
      , cc.order_seq
      , cc.use_yn
      , gc.group_code_name
    FROM      common_code cc
    LEFT JOIN group_code gc ON cc.group_code = gc.group_code
    WHERE     cc.group_code IN (${placeholders})
    AND       cc.use_yn = 'Y'
    ${addCondition}
    ORDER BY cc.group_code ASC, cc.order_seq ASC
  `;

  db.query(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json(err);
    }
    const byGroup = {};
    for (const row of rows) {
      if (!byGroup[row.group_code]) byGroup[row.group_code] = [];
      byGroup[row.group_code].push(row);
    }
    res.status(200).json({ result: byGroup });
  });
};

// 그룹 코드 조회
exports.selectGroupCodeList = (req, res) => {
  const query = `
    SELECT
      group_code
      , group_code_name
      , group_code_bundle
      , group_code_memo
      , order_seq
      , use_yn
      , reg_dt
      , reg_id
      , mod_dt
      , mod_id
    FROM     group_code
    ORDER BY group_code ASC
  `;

  db.query(query, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 공통 코드 등록
exports.insertCommonCode = (req, res) => {
  try {
    const { common_code, group_code, common_code_name, order_seq, userId } = req.body;

    const now = dayjs();
    const dt = now.format("YYYYMMDDHHmmss");
    let insertQuery = '';

    insertQuery = `
      INSERT INTO common_code (
        common_code
        , group_code
        , common_code_name
        , common_code_memo
        , order_seq
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
      )
    `;

    db.query(
      insertQuery,
      [common_code, group_code, common_code_name, null, order_seq, 'Y', dt, userId || null, null, null],
      (err, result) => {
        if (err) {
          console.error("공통코드 등록 오류:", err);
          return res
            .status(500)
            .json({ error: "공통코드 등록 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "공통코드가 성공적으로 등록되었습니다.",
        });
      }
    );
  } catch (error) {
      console.error("공통코드 등록 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 그룹 코드 등록
exports.insertGroupCode = (req, res) => {
  try {
    const { group_code, group_code_name, order_seq, userId } = req.body;

    const now = dayjs();
    const dt = now.format("YYYYMMDDHHmmss");
    let insertQuery = '';

    insertQuery = `
      INSERT INTO group_code (
        group_code
        , group_code_name
        , group_code_bundle
        , group_code_memo
        , order_seq
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
      )
    `;

    db.query(
      insertQuery,
      [group_code, group_code_name, null, null, order_seq, 'Y', dt, userId, null, null],
      (err, result) => {
        if (err) {
          console.error("그룹 코드 등록 오류:", err);
          return res
            .status(500)
            .json({ error: "그룹 코드 등록 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "그룹 코드가 성공적으로 등록되었습니다.",
        });
      }
    );
  } catch (error) {
      console.error("그룹 코드 등록 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 그룹/공통 코드 사용 여부 수정
exports.updateUseYn = (req, res) => {
  try {
    const { group_code, common_code, use_yn, userId } = req.body;

    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");
    let updateQuery = '';

    // common_code가 있으면 공통코드 업데이트, 아니면 그룹코드 업데이트
    if (common_code) {
      updateQuery = `
        UPDATE common_code SET
          use_yn = ?
          , mod_dt = ?
          , mod_id = ?
        WHERE common_code = ?
      `;
    } else {
      updateQuery = `
        UPDATE group_code SET
          use_yn = ?
          , mod_dt = ?
          , mod_id = ?
        WHERE group_code = ?
      `;
    }

    db.query(
      updateQuery,
      [use_yn, mod_dt, userId || null, common_code || group_code],
      (err, result) => {
        if (err) {
          console.error("그룹 코드 사용 여부 수정 오류:", err);
          return res
            .status(500)
            .json({ error: "사용 여부 수정 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "사용 여부가 성공적으로 수정되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("그룹 코드 사용 여부 수정 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};